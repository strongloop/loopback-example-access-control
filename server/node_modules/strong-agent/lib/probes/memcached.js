var nf = require('../nodefly');
var proxy = require('../proxy');
var samples = require('../samples');
var counts = require('../counts');
var tiers = require('../tiers');
var topFunctions = require('../topFunctions');
var graphHelper = require('../graphHelper');

var commands = [
	'get',
	'gets',
	'getMulti',
	'set',
	'replace',
	'add',
	'cas',
	'append',
	'prepend',
	'increment',
	'decrement',
	'incr',
	'decr',
	'del',
	'delete',
	'version',
	'flush',
	'samples',
	'slabs',
	'items',
	'flushAll',
	'samplesSettings',
	'samplesSlabs',
	'samplesItems',
	'cachedump'
];


module.exports = function(memcached) {

	commands.forEach(function(command) {
		proxy.before(memcached.prototype, command, function(client, args) {
			if(nf.paused) return;

			// ignore, getMulti will be called
			if(command === 'get' && Array.isArray(args[0])) return;

			var timer = samples.timer("Memcached", command);
			var graphNode = graphHelper.startNode('Memcached', command, nf);
			counts.sample('memcached');

			var query = command + ' ' + args[0];
			proxy.callback(args, -1, function(obj, args, extra) {
				timer.end();

				topFunctions.add('memcacheCalls', query, timer.ms);
				graphHelper.updateTimes(graphNode, timer);
				if (extra) {
					extra.memcached = extra.memcached || 0;
					extra.memcached += timer.ms;
					if (extra.closed) {
						tiers.sample('memcached_out', timer);
					}
					else {
						tiers.sample('memcached_in', timer);
					}
				}
				else {
					tiers.sample('memcached_in', timer);
				}

			});

			if (graphNode) nf.currentNode = graphNode.prevNode;
		});
	});
};

