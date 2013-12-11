/**
 * Hijack connect session so I don't need to build my own session store
 */

var Session = require('connect/lib/middleware/session/session')
	, MemoryStore = require('connect/lib/middleware/session/memory')
	, Cookie = require('connect/lib/middleware/session/cookie')
	, Store = require('connect/lib/middleware/session/store')
	, uid = require('uid2');

/**
 * Probably don't actually need these, but left them anyway
 */

exports = module.exports = session;
exports.Store = Store;
exports.Cookie = Cookie;
exports.Session = Session;
exports.MemoryStore = MemoryStore;

var env = process.env.NODE_ENV;
var warning = 'Warning: connection.session() MemoryStore is not\n'
	+ 'designed for a production environment, as it will leak\n'
	+ 'memory, and will not scale past a single process.';

/**
 * Instantiate the session store
 * 
 * @param  {object} options [options to initialize store with]
 * @return {Store}          [initialized store]
 */

function session (options) {
	var options = options || {}
		, store = options.store || new MemoryStore
		, cookie = options.cookie || {};

	// notify user that this store is not
	// meant for a production environment
	if ('production' == env && store instanceof MemoryStore) {
		console.warn(warning);
	}

	// generates the new session
	store.generate = function (req) {
		req.sessionID = uid(24);
		req.session = new Session(req);
		req.session.cookie = new Cookie(cookie);
	};

	return store;
};