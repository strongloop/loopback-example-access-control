// ctl: start/stop the control channel server
//
// It accepts json requests, passes them to master object to be handled, and
// returns json responses. Currently a singleton.

var assert = require('assert');
var fs = require('fs');
var net = require('net');
var path = require('path');
var util = require('util');

var cmd = require('./cmd');
var debug = require('./debug');

var ADDR = 'clusterctl';
var server;
var unlinkAddr;

function start(master, options) {
  options = util._extend({}, options);

  var addr = options.addr || ADDR;

  debug('ctl - start on', addr, 'master', this);

  assert(!server, 'ctl is already started');


  unlinkAddr = function unlinkAddr() {
    try {
      fs.unlinkSync(addr);
    } catch(er) {
      debug('ctl - ignoring unlink', addr, 'error:', er.message);
    }
  };

  unlinkAddr();

  net.createServer({allowHalfOpen: true}, function (sock) {
    debug('ctl - accept connection', sock.remoteAddress);
    master.emit('connection', sock);

    sock.on('error', function(er) {
      // We just don't care if we fail to recv a request, or send a response.
      debug('ctl - ignoring error', er.stack);
    });

    cmd.recv(sock, function(req) {
      master.request(req, function(rsp) {
        debug('ctl - response', rsp);
        cmd.send(sock, rsp);
      });
    });

  }).on('error', function(er) {
    debug('ctl - listen failed', er);
    master.emit('error', er);
  }).on('close', function() {
    server = undefined;
  }).listen(addr, function () {
    server = this; // because it isn't valid to close a server until it is listening
    debug('ctl - listen on', server.address());
    master.emit('listening', this);
  });

  process.once('exit', unlinkAddr);
}

function stop(callback) {
  var _ = server;

  if(server) {
    server.close(function() {
      unlinkAddr();
      process.removeListener('exit', unlinkAddr);
      callback();
    });
  } else {
    process.nextTick(callback);
  }

  server = undefined;

  return _;
}

exports.start = start;
exports.stop = stop;
exports.ADDR = ADDR;
