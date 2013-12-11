var SendEmitter = require('./send_emitter')
	, util = require('util');

/**
 * Client connection event emitter
 * 
 * @param {net.Socket} socket [Net socket client]
 * @param {net.Server} server [Net server the socket is a client of]
 */

function Connection (socket, server) {
	SendEmitter.call(this);
	this.attach(socket);
	this.socket = socket;

	// Attach session right away
	this.sessionStore = server.sessionStore;
	this.sessionStore.generate(this);

	// Starting a new connection
	this.once('start', this.start);
	socket.once('close', this.disconnect.bind(this));

	// Log errors to console, if error logging is enabled
	var con = this;
	socket.on('error', function (err) {
		con.emit('error', err);
	});
	this.on('error', function (err) {
		if (server.logErrors) {
			console.error(err.stack);
		}
	});

	// Save session whenever it changes
	this.on('_set', function () {
		this.session.resetMaxAge();
		this.session.save(function (err) {
			if (err) console.error(err.stack);
		});
	});
}
util.inherits(Connection, SendEmitter);
module.exports = Connection;

// Confirm the requested features exist
function allowedConfig (config) {
	return {
		objectMode: !!config.objectMode
		, enableAcks: !!config.enableAcks
	};
}

/**
 * Start a new connection session
 */

Connection.prototype.start = function (config) {
	config || (config = {});
	this.objectMode = !!config.objectMode;
	this.enableAcks = !!config.enableAcks;

	if (this.session.sessionID) {
		return this.resume(this.session.sessionID, config);
	}

	this.set('sessionID', this.sessionID);
	this.ready = true;
	this.emit('connect');
	this.send('connect', allowedConfig(config));
};

/**
 * Resume existing connection session
 * 
 * @param  {string} id [Session id to resume]
 */

Connection.prototype.resume = function (id, config) {
	var ev = this;

	this.sessionID = this.session.sessionID;
	this.sessionStore.get(id, function (err, session) {
		if (err || ! session) {
			delete ev.session.sessionID;
			return ev.start(config);
		}
		ev.sessionStore.createSession(ev, session);
		ev.syncSession();
		ev.ready = true;
		ev.emit('connect', true);
		ev.send('connect', allowedConfig(config));
	});
};

/**
 * Save session state after a disconnect
 */

Connection.prototype.disconnect = function () {
	this.emit('disconnect');
	this.ready && (this.ready = false);
};

/**
 * Invalidate session
 */

Connection.prototype.invalidateSession = function () {
	var ev = this;
	this.sessionStore.destroy(this.session.sessionID, function (err) {
		ev.send('invalidateSession');
	});
};
