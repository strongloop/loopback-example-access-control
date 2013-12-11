// master: cluster control occurs in the master process

var assert = require('assert');
var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;
var os = require('os');
var util = require('util');

var ctl = require('./ctl');
var debug = require('./debug');
var msg = require('./msg');

// Master is a singleton, as is the cluster master
var master = new EventEmitter();

function clusterSize() {
  return Object.keys(cluster.workers).length;
}

var OPTION_DEFAULTS = {
    shutdownTimeout: 5000,
    terminateTimeout: 5000,
};

master.request = request; // XXX(sam) not public, should be master._request
master.setSize = setSize;
master._resize = resize;
master._startOne = startOne;
master._stopOne = stopOne;
master.shutdown = shutdown;
master.terminate = terminate;
master.options = util._extend({}, OPTION_DEFAULTS);
master.start = start;
master.stop = stop;
master.loadOptions = require('./load-options');
master.ADDR = ctl.ADDR;
master.CPUS = os.cpus().length;
master.cmd = msg;

function request(req, callback) {
  debug('master - request', req);

  var cmd = req.cmd;
  var rsp = {
  };

  if(cmd === 'status') {
    rsp.workers = [];

    for (var id in cluster.workers) {
      var w = cluster.workers[id];
      rsp.workers.push({
        id: id,
        pid: w.process.pid,
      });
    }

  } else if(cmd === 'set-size') {
    try {
      master.setSize(req.size);
    } catch(er) {
      rsp.error = er.message;
    }

  } else if(cmd === 'disconnect') {
    // XXX temporary, for testing
    cluster.disconnect();

  } else if(cmd === 'fork') {
    // XXX temporary, for testing
    cluster.fork();

  } else {
    rsp.error = 'unsupported command ' + req.cmd;
  }

  if(callback) {
    process.nextTick(callback.bind(null, rsp));
  }

  return this;
}

// XXX how to check for properly formed int?
function setSize(size) {
  var self = this;

  debug('master - set size to', size, 'from', self.size);

  self.size = size;

  process.nextTick(self._resize.bind(self));

  return self;
}

function resize() {
  var self = this;

  if(self.size === null || self.size === undefined) {
    return;
  }

  var currentSize = clusterSize();

  debug('master - resize to', self.size, 'from', currentSize, 'resizing?', self._resizing);

  if(self._resizing) {
    // don't start doing multiple resizes in parallel, the events get listened
    // on by both sets, and get multi-counted
    return;
  }

  self._resizing = true;

  if(currentSize < self.size) {
    self._startOne(resized);
  } else if(currentSize > self.size) {
    self._stopOne(resized);
  } else {
    debug('master - worker count resized to', self.size);
    self._resizing = false;
    self.emit('resize', self.size);
  }

  function resized() {
    self._resizing = false;
    self._resize();
  }

  return self;
}

function startOne(callback) {
  var self = this;
  var worker = cluster.fork(self.options.env);

  debug('master - one worker forked', worker.id);

  worker.once('online', online);
  worker.once('exit', exit);

  function online() {
    debug('master - one worker started online', this.id);
    self.emit('startWorker', worker);
    worker.removeListener('exit', exit);
    callback(worker);
  }

  function exit() {
    // XXX TODO handle failure to start, this will currently busy loop
    debug('master - one worker started exit', this.id, 'suicide?', this.suicide);
    worker.removeListener('online', online);
    callback();
  }
}

// shutdown the first worker that has not had .disconnect() called on it already
function stopOne(callback) {
  var self = this;
  // XXX(sam) picks by key order, semi random? should it sort by id, and
  // disconnect the lowest? or sort by age, when I have it, and do the oldest?
  var workerIds = Object.keys(cluster.workers);
  for(var i = workerIds.length - 1; i >= 0; i--) {
    var id = workerIds[i];
    var worker = cluster.workers[id];
    var connected = !worker.suicide; // suicide is set after .disconnect()

    debug('master - considering worker for stop', id, 'connected?', connected);

    if(connected) {
      worker.once('exit', function(code, sig) {
        debug('master - one worker stopped', this.id, 'code', code, 'sig', sig);
        self.emit('stopWorker', worker, code, sig);
        callback();
      });
      self.shutdown(worker.id);
      return;
    }
  }
  debug('master - found no workers to stop');
  process.nextTick(callback);
}

function setControl(id) {
  var worker = cluster.workers[id];
  assert(worker, 'worker id invalid');
  worker._control = worker._control || {};
  return worker;
}

function shutdown(id) {
  var worker = setControl(id);

  debug('master - shutdown', id, 'already?', !!worker._control.exitTimer);

  if(worker._control.exitTimer) {
    return;
  }
  worker.send({cmd: msg.SHUTDOWN});
  worker.disconnect();

  worker._control.exitTimer = setTimeout(function() {
    worker._control.exitTimer = null;
    master.terminate(null, worker);
  }, master.options.shutdownTimeout);

  worker.once('exit', function() {
    debug('master - shutdown exit for', worker.id, cluster.workers[id]);
    clearTimeout(worker._control.exitTimer);
  });

  return master;
}

// The worker arg is because as soon as a worker's comm channel closes, its
// removed from cluster.workers (the timing of this is not documented in node
// API), but it can be some time until exit occurs, or never. since we want to
// catch this, and TERM or KILL the worker, we need to keep a reference to the
// worker object, and pass it to terminate ourself, because it can no longer
// look it up by id.
function terminate(id, worker) {
  worker = worker || setControl(id);

  debug('master - terminate', id, 'already?', !!worker._control.exitTimer);

  if(worker._control.exitTimer) {
    return;
  }
  worker.kill();

  worker._control.exitTimer = setTimeout(function() {
    worker.kill('SIGKILL');
  }, master.options.terminateTimeout);

  worker.once('exit', function() {
    clearTimeout(worker._control.exitTimer);
  });

  return master;
}

// Functions need to be shared between start and stop, so they can be removed
// from the events on stop.
function resizeOnExit(worker, code, signal) {
  debug('master - on worker exit', worker.id, 'code?', code, 'signal?', signal);
  master._resize();
}

function resizeOnFork(worker, code, signal) {
  debug('master - on worker fork', worker.id);
  master._resize();
}

function start(options, callback) {
  var self = master;

  // both options and callback are optional, adjust position based on type
  if(typeof callback === 'undefined') {
    if(typeof options === 'function') {
      callback = options;
      options = undefined;
    }
  }

  options = options || {};

  if(options.port !== undefined) {
    options.port = +options.port;
  }

  self.options = { addr: options.path || options.port };
  self.options = util._extend(self.options, OPTION_DEFAULTS);
  self.options = util._extend(self.options, options);

  options = self.options;

  debug('master - start', options, callback);

  self.options = options;

  self.setSize(options.size);

  cluster.on('exit', resizeOnExit);
  cluster.on('fork', resizeOnFork);

  ctl.start(self, {addr: options.addr});

  if(callback) {
    self.once('start', callback);
  }

  self.once('listening', function(server) {
    process.nextTick(function() {
      self.emit('start', server.address());
    });
  });

  return self;
}

function stop(callback) {
  var self = master;
  if(callback) {
    self.once('stop', callback);
  }
  cluster.removeListener('exit', resizeOnExit);
  cluster.removeListener('fork', resizeOnFork);
  ctl.stop(self.emit.bind(self, 'stop'));
}

module.exports = master;
