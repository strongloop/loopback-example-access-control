var nf = require('../nodefly');
var proxy = require('../proxy');
var samples = require('../samples');
var counts = require('../counts');
var tiers = require('../tiers');
var topFunctions = require('../topFunctions');
var graphHelper = require('../graphHelper');

module.exports = function(obj) {

	proxy.after(obj, ['createClient', 'createConnection'], function(obj, args, ret) {
		var client = ret;

		proxy.before(client, 'query', function(obj, args) {
			if(nf.paused) return;

			//var trace = samples.stackTrace();
			var command = args.length > 0 ? args[0] : undefined;

			var params = args.length > 1 && Array.isArray(args[1]) ? args[1] : undefined;
			var timer = samples.timer("MySQL", "query");

			var graphNode = graphHelper.startNode('MySQL', command, nf);
			counts.sample('mysql');

			proxy.callback(args, -1, function(obj, args, extra, graph, currentNode) {
				timer.end();
				topFunctions.add('mysqlCalls', command, timer.ms);

				graphHelper.updateTimes(graphNode, timer);


				if (extra) {
					extra.mysql = extra.mysql || 0;
					extra.mysql += timer.ms;
					if (extra.closed) {
						tiers.sample('mysql_out', timer);
					}
					else {
						tiers.sample('mysql_in', timer);
					}
				}
				else {
					tiers.sample('mysql_in', timer);
				}
			}, null, true);

			if (graphNode) nf.currentNode = graphNode.prevNode;
		});
	});
};

