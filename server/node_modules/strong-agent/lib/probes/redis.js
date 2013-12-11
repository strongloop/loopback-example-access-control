function debug (format, args) {
	if (/redis/.test(process.env.NODEFLY_DEBUG) ) {
		console.log.apply(console, ['REDIS: ' + format].concat(args || []));
	}
}

var nf = require('../nodefly');
var proxy = require('../proxy');
var samples = require('../samples');
var counts = require('../counts');
var tiers = require('../tiers');
var topFunctions = require('../topFunctions');
var graphHelper = require('../graphHelper');

module.exports = function(redis) {

	proxy.before(redis.RedisClient.prototype, 'send_command', function (obj, args, ret) {
		if (nf.paused) return;

		var command = args[0]
			, input = args[1]
			, timer = samples.timer("Redis", command)
			, query = command + (typeof input[0] === 'string' ? ' "' + input[0] + '"' : '')
			, graphNode = graphHelper.startNode('Redis', query, nf);

		counts.sample('redis');
		debug('command: %s', [command]);

		function handle (obj, args, extra) {
			timer.end();

			debug('%s callback', [command]);
			topFunctions.add('redisCalls', query, timer.ms);
			graphHelper.updateTimes(graphNode, timer);

			if (extra) {
				debug('%s extra: ', [extra]);
				extra.redis = extra.redis || 0;
				extra.redis += timer.ms;
				tiers.sample(extra.closed ? 'redis_out' : 'redis_in', timer);
			}
			else {
				tiers.sample('redis_in', timer);
			}
		}

		// Support send_command(com, [arg, cb]) and send_command(com, [arg], cb)
		if (typeof args[args.length-1] === 'function') {
			proxy.callback(args, -1, handle);
		} else {
			// Hack to support optional functions by adding noop function when blank
			if (typeof input[input.length-1] !== 'function') {
				input.push(function () {})
			}
			proxy.callback(input, -1, handle);
		}

		if (graphNode) nf.currentNode = graphNode.prevNode;
	});
};