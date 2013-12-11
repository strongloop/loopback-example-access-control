var nf = require('../nodefly');
var proxy = require('../proxy');
var samples = require('../samples');
var counts = require('../counts');
var tiers = require('../tiers');
var topFunctions = require('../topFunctions');
var graphHelper = require('../graphHelper');

var commands = [
	'get',
	'set',
	'delete',
	'add',
	'replace',
	'append',
	'prepend',
	'cas',
	'increment',
	'decrement',
	'samples'
];


var findCallback = function(args) {
	for(var i = 0; i < args.length; i++)
		if(typeof args[i] === 'function') return i;
};


module.exports = function(obj) {

	// connect
	proxy.after(obj.Client.prototype, 'connect', function(obj, args, ret) {
		//obj.__trace__ = samples.stackTrace();
		obj.__timer__ = samples.timer("Memcached", "connect");
	});

	proxy.before(obj.Client.prototype, 'on', function(obj, args) {
		var client = obj;
		var event = args[0];
		if(event !== 'connect' && event !== 'timeout' && event !== 'error') return;

		proxy.callback(args, -1, function(obj, args) {
			if(nf.paused) return;

			var timer = client.__timer__;
			//if(!time || !timer.done()) return;
			timer.end();

			// not doing anything with on connect/timeout/error events just yet
		});
	});


	// commands
	commands.forEach(function(command) {
		proxy.before(obj.Client.prototype, command, function(client, args) {
			if(nf.paused) return;

			var timer = samples.timer("Memcached", command);
			counts.sample('memcached');

			// there might be args after callback, need to do extra callback search
			var pos = findCallback(args);
			if(pos == undefined) return;

			var query = command + ' ' + args[0];
			var graphNode = graphHelper.startNode('Memcached', query, nf);

			proxy.callback(args, pos, function(obj, args, extra) {
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
			}); // callback

			if (graphNode) nf.currentNode = graphNode.prevNode;
		});
	});

}; // exports

