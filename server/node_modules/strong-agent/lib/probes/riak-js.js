var nf = require('../nodefly');
var proxy = require('../proxy');
var samples = require('../samples');
var counts = require('../counts');
var tiers = require('../tiers');
var topFunctions = require('../topFunctions');
var graphHelper = require('../graphHelper');

module.exports = function(riak) {
	proxy.after(riak, ['getClient'], function(obj, args, ret) {
		var client = ret;
		var clientType = args[0].api || "http"; // http or protobuf

		proxy.before(client, ['get', 'save', 'head', 'exists', 'remove'], function(obj, args, method) {
			if (nf.paused) { return; }

			var trace = samples.stackTrace();
			var time = samples.time("Riak", method);
			var graphNode = graphHelper.startNode('Riak', method, nf);
			counts.sample('riak');

			// get(): (bucket, key, options, callback)
			// save(): (bucket, key, data, options, callback)
			// head(): (bucket, key, options, callback)
			// exists(): (bucket, key, options, callback) -> calls head()
			// remove(): (bucket, key, options, callback)

			var bucket = args.length > 0 ? args[0] : undefined;
			var key = args.length > 1 ? args[1] : undefined;

			// q = clientType.bucket.key.get()
			var q = clientType + '.' + bucket + '.' + key + '.' + method;

			function handle(obj, args, extra) {
				if (!time.done()) return;

				topFunctions.add('riakCalls', q, time.ms);
				graphHelper.updateTimes(graphNode, time);

				if (extra) {
					extra.riak = extra.riak || 0;
					extra.riak += time.ms;

				}
				tiers.sample('riak_in', time);
			}

			proxy.callback(args, -1, handle, null, true);
			if (graphNode) nf.currentNode = graphNode.prevNode;
		});
	});
};