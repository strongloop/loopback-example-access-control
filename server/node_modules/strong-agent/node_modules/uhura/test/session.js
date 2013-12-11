var Uhura = require('../')
	, should = require('should');

function after (t, fn) {
	return function () {
		t-- && t === 0 && fn();
	};
}

var socket = 5000;

describe('session', function () {
	this.timeout(5000);

	// Kill server and client after each test
	var c, server;
	afterEach(function (next) {
		c.disconnect();
		server.close(next);
	});

	it('should keep session', function (next) {
		server = Uhura.createServer(function (s) {
			setTimeout(function () {
				s.socket.destroy();
			}, 100);
		});
		server.listen(socket);
		
		c = Uhura.createClient(socket);
		c.autoReconnect();

		var sessionID;
		c.once('connect', function () {
			sessionID = c.get('sessionID');
		});

		c.on('connect', after(2, function () {
			if (c.get('sessionID') !== sessionID) {
				next(new Error('sessionID does not match'));
			}
			next();
		}));
	});

	it('should send changes to client', function (next) {
		server = Uhura.createServer(function (s) {
			c.once('_set', function () {
				s.socket.destroy();
				setTimeout(function () {
					c.get('foo').should.equal('bar');
					next()
				}, 100);
			});
			
			s.set('foo', 'bar');
		});
		server.listen(socket);

		c = Uhura.createClient(socket);
	});

	it('should send changes to server', function (next) {
		server = Uhura.createServer(function (s) {
			s.on('_set', function () {
				s.get('foo').should.equal('bar');
				s.socket.destroy();
			});
		});
		server.listen(socket);

		c = Uhura.createClient(socket);
		c.on('connect', function () {
			c.set('foo', 'bar');
		});
		c.on('disconnect', next);
	});

	it('should invalidate session', function (next) {
		server = Uhura.createServer(function (s) {
			c.on('invalidateSession', function () {
				should.not.exist(c.get('sessionID'));
				s.socket.destroy();
				next();
			});
			s.invalidateSession();
		});
		server.listen(socket);
		
		c = Uhura.createClient(socket);
	});
});
