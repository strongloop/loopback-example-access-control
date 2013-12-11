// cluster-control:

var cluster = require('cluster');

if (cluster.isMaster) {
  module.exports = require('./lib/master');
} else {
  // Calling .start() in a worker is a nul op
  exports.start = function (options, callback) {
    // both options and callback are optional, adjust position based on type
    // XXX cut-n-paste from lib/master, is it possible to factor out, maybe
    // into a function that modifies arguments?
    if(typeof callback === 'undefined') {
      if(typeof options === 'function') {
        callback = options;
        options = undefined;
      }
    }

    if(callback) {
      process.nextTick(callback);
    }
  };
  exports.stop = function(callback) {
    if(callback) {
      process.nextTick(callback);
    }
  };
  exports.cmd = require('./lib/msg');
  exports.loadOptions = require('./lib/load-options');
}
