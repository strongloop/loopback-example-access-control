var uuid = require('node-uuid');

module.exports = Acks;

function Acks () {}
Acks.prototype = new Array;

Acks.prototype.create = function (callback) {
  var ack = { id: uuid(), callback: callback };
  this.push(ack);
  return ack;
};

// Resolve just splices the id out of the list
Acks.prototype.resolve = function (id) {
  var ack = this.filter(function (ack) {
    return ack.id === id;
  })[0];
  if ( ! ack) return;
  this.splice(this.indexOf(ack), 1);
  ack.callback();
};
