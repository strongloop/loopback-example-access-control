var nf = require('../nodefly');
var proxy = require('../proxy');
var counts = require('../counts');

module.exports = function (strongmq) {
	proxy.after(strongmq, 'create', function (obj, args, connection) {
		proxy.after(connection, ['createPushQueue','createPubQueue'], function (obj, args, queue) {
			proxy.after(queue, 'publish', function (obj, args, queue) {
				counts.sample('strongmq_out');
			});
		});
		proxy.after(connection, ['createPullQueue','createSubQueue'], function (obj, args, queue) {
			queue.on('message', function () {
				counts.sample('strongmq_in');
			});
		});
	});
};