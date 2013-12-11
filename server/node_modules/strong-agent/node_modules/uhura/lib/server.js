var Connection = require('./connection')
	, Session = require('./session')
	, net = require('net');

/**
 * Server constructor
 * 
 * @param {object} options [options to pass to the session constructor]
 */

function Server (options) {
	this.sessionStore = Session(options);
	this._sessions = [];
}
module.exports = Server;

/**
 * Start the server
 * 
 * @param  {function}   [cb] [Callback to handle each connection]
 * @return {net.Server}      [Server instance created]
 */

Server.prototype.start = function (cb) {
	var server = this;
	return net.createServer(function (socket) {
		var con = new Connection(socket, server);
		con.once('connect', function (reconnect) {
			cb(con, reconnect);
		});
	});
};