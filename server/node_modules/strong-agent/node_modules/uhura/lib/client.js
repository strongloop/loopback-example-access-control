var SendEmitter = require('./send_emitter')
	, util = require('util')
	, net = require('net');

/**
 * Create a client
 */

function Client () {
	SendEmitter.call(this);

	// When we receive a start event from the server,
	// flag as ready to send queued data
	this.on('connect', function (config) {
		config || (config = {});
		this.objectMode = !!config.objectMode;
		this.enableAcks = !!config.enableAcks;
		this.ready = true;
	});

	// Log errors to console, if error logging is enabled
	this.on('error', function (err) {
		if (this.logErrors) {
			console.error(err.stack);
		}
	});

	// Allow server to invalidate sessions
	this.on('invalidateSession', function () {
		this.session = {};
		this.socket.destroy();
	});
}
util.inherits(Client, SendEmitter);
module.exports = Client;

/**
 * Connect the client to a net server
 * 
 * @param  {mixed}  port [Port to connect to, can be number or string]
 * @param  {string} host [Host to connect to]
 */

Client.prototype.connect = function (port, host) {
	var ev = this;

	// Store port and host to use for reconnections
	this.port = port;
	this.host = host;

	// Create socket and attach to emitter
	// On first connect, start a new session.
	// On subsequent connects, re-establish session.
	var socket = this.socket = net.connect(this.port, this.host, function () {
		ev.syncSession();
		ev._send(['start', {
			objectMode: true
			, enableAcks: true
		}]);
	});
	this.attach(socket);

	// Pass socket errors through to emitter
	socket.on('error', function (err) {
		ev.emit('error', err);
	});

	// If the socket closes, disable ready state and notify,
	// then attempt to backoff and reconnect
	socket.on('close', function () {
		ev.ready = false;
		ev.emit('disconnect');

		if (ev._reconnect) {
			var delay = Math.min(ev._retryTimeoutMax, Math.pow(ev._retryTimeout, ev._retries));
			ev._retries++;
			setTimeout(ev.reconnect.bind(ev), delay);
		}
	});
};

/**
 * Disconnect socket
 */

Client.prototype.disconnect = function () {
	this._reconnect = false;
	this.socket.destroy();
};

/**
 * Reconnect socket
 */

Client.prototype.reconnect = function () {
	this.ready && (this.ready = false);
	this.socket.end();
	this.connect(this.port, this.host);
};

/**
 * Enable exponential backoff reconnection system
 * 
 * @param  {number} min [Millisecond delay until first reconnect attempt]
 */

Client.prototype.autoReconnect = function (min, max) {
	// Setup the state and use min indirectly,
	// so we can reestablish the logic for the next disconnect.
	min || (min = 100);
	max || (max = 60000);
	this._reconnect = true;
	this._retries = 0;
	this._retryTimeout = min;
	this._retryTimeoutMax = max;

	function done () {
		this.once('connect', function () {
			this.autoReconnect(min, max);
		});
	}

	// When a connection completes, reset the backoff variables
	this.ready ? done.call(this) : this.once('connect', done);
};
