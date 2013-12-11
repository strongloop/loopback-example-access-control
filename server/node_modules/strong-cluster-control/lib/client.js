// client: make requests of the cluster controller

var net = require('net');

var cmd = require('./cmd');
var ctl = require('./ctl');
var debug = require('./debug');

// make a single request, response is passed to the callback, and the socket is
// returned so it can be listened to for the 'error' event
function client(addr, request, callback) {
  addr = addr || ctl.ADDR;

  debug('client - connect to', addr);

  var sock = net.connect(addr, connect);

  function connect() {
    cmd.send(this, request);
    cmd.recv(this, callback);
  }

  return sock;
}

exports.request = client;
exports.ADDR = ctl.ADDR;
