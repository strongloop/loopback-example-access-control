var should = require('should');

var http = require('http');
var Uhura = require('uhura');
var tiers = require('../lib/tiers');
var config = require('../lib/config');
var Transport = require('../lib/transport');
var nf = require('../lib/main');

describe('tiers', function () {

	function verifyDataIntegrity (data) {
		data.should.have.property('tiers');
		data.tiers.should.have.property('http');

		data.tiers.http.should.have.property('mean');
		data.tiers.http.mean.should.be.a('number');
	}

	// Unit test
	it('should store data in measured', function () {
		// Stub out start and initialize
		var oldStart = tiers.prototype.start;
		tiers.prototype.start = function () {};
		var test = tiers.init();
		tiers.prototype.start = oldStart;

		// Add some data
		test.sample('http', { ms: Date.now() });

		// Restore old start
		tiers.prototype.start = oldStart;

		// Verify data structure is as expected
		var data = test.stats.toJSON();
		try { verifyDataIntegrity(data); }
		catch (e) { throw new Error(e); }
	});

	// Integration test
	it('should output correctly to collector', function (next) {
		this.timeout(50000);

		// Do some cheating to speed up the test
		config.tiersInterval = 500;

		var expressServer;

		// Black hole
		var uhuraServer = Uhura.createServer(function (c) {
			c.on('createSession', function () {
				c.send('newSession', null, {
					sessionId: 'foo'
					, appHash: 'bar'
				});
			});

			function verify (data) {
				nf.stop();
				c.disconnect();

				expressServer.close(function () {
					uhuraServer.close(function () {
						try { verifyDataIntegrity(data); }
						catch (e) { next(e); }
						next();
					});
				});
			}

			c.on('update', function (data) {
				data.tiers && data.tiers.http && verify(data);
			});
		}).listen(6000, function onListening() {
			// Start profiling
			nf.profile('foo', 'bar', { port: uhuraServer.address().port });

			// Start an express server and make a request to it
			var express = require('express');
			var request = require('request');

			var app = express();
			app.get('/', function (req, res) { res.end('bar'); });

			// Wrap in http server so it can be closed properly
			expressServer = http.createServer(app);
			expressServer.listen(7000, function () {
				var port = 7000,
						url = 'http://127.0.0.1:' + port + '/';
				request(url, function () {});
			});
		});
	});

});
