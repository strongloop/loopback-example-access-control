var Uhura = require('../');

function after (t, fn) {
	return function () {
		t-- && t == 0 && fn();
	}
}

describe('basics', function () {
	this.timeout(5000);

	var s, c, server;
	beforeEach(function (next) {
		var done = after(1, next);
		server = Uhura.createServer(function (socket) {
			s = socket;
			done();
		});
		server.listen(5555);
		c = Uhura.createClient(5555);
	});

	afterEach(function (next) {
		server.close(next);
		c.disconnect();
	});

	it('should connect to server', function (next) {
		c.once('connect', function () { next(); });
	});

	it('should receive server events', function (next) {
		c.once('ping', next);
		s.send('ping');
	});

	it('should receive client events', function (next) {
		s.once('ping', next);
		c.send('ping');
	});

	it('should emit disconnect on socket.destroy()', function (next) {
		c.once('disconnect', next);
		s.socket.destroy();
	});

	it('should log errors when enabled', function (next) {
		c.logErrors = true;
		var oldError = console.error;
		console.error = function () {
			next();
			console.error = oldError;
		};
		c.socket.emit('error', new Error('This is an error'));
		s.socket.destroy();
	});

	it('should send acknowledgements', function (next) {
		c.send('ping', next);
	});
});
