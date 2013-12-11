var Client = require('./client')
	, Server = require('./server')
	, Session = require('./session');

/**
 * This is lowercase to mirror how connect.session works
 * 
 *   var RedisStore = require('connect-redis')(Uhura);
 *   var server = Uhura.createServer({
 *     store: new RedisStore(options)
 *   }, function (socket) {
 *     // Session-aware socket/emitter
 *   });
 */

exports.session = Session;

/**
 * Create uhura client
 * 
 * @param {mixed}       [port] [Port, as number or string, to use in net.connect]
 * @param {string}      [host] [Optional host name to use in net.connect]
 * @return {net.Socket}        [Client emitter]
 */

exports.Client = Client;
exports.createClient = function (port, host) {
	var client = new Client;
	client.connect(port, host);
	return client;
};

/**
 * Create uhura server
 *
 * @param {object}      [options] [Optional session store options]
 * @param {function}    [cb]      [Function to handle each connection]
 * @return {net.Socket}           [TCP server to use, not yet listening]
 */

exports.Server = Server;
exports.createServer = function (options, cb) {
	if (typeof options === 'function') {
		cb = options;
		options = {};
	}
	var server = new Server(options);
	return server.start(cb);
};