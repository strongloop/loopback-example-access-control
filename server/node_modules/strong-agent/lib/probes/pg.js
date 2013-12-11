var nf = require('../nodefly');
var proxy = require('../proxy');
var samples = require('../samples');
var counts = require('../counts');
var tiers = require('../tiers');
var topFunctions = require('../topFunctions');


var tier = 'postgres';
function recordExtra(extra, timer) {
	if (extra) {
		extra[tier] = extra[tier] || 0;
		extra[tier] += timer.ms;

		if (extra.closed) {
			tiers.sample(tier + '_out', timer);
		}
		else {
			tiers.sample(tier + '_in', timer);
		}
	}
	else {
		tiers.sample(tier + '_in', timer);
	}
}

module.exports = function(obj) {

	function probe(obj) {
		if(obj.__probeInstalled__) return;
		obj.__probeInstalled__ = true;

		// Callback API
		proxy.before(obj, 'query', function(obj, args, ret) {
			var client = obj;

			var command = args.length > 0 ? args[0] : undefined;
			var params = args.length > 1 && Array.isArray(args[1]) ? args[1] : undefined;
			var timer = samples.timer("PostgreSQL", "query");
			counts.sample('postgres');

			proxy.callback(args, -1, function(obj, args, extra) {
				timer.end();

				topFunctions.add('postgresCalls', command, timer.ms);
				recordExtra(extra, timer);
			});
		});


		// Evented API
		proxy.after(obj, 'query', function(obj, args, ret) {
			// If has a callback, ignore
			if(args.length > 0 && typeof args[args.length - 1] === 'function') return;

			var client = obj;
			var command = args.length > 0 ? args[0] : undefined;
			var params = args.length > 1 && Array.isArray(args[1]) ? args[1] : undefined;
			var timer = samples.timer("PostgreSQL", "query");
			counts.sample('postgres');

			proxy.before(ret, 'on', function(obj, args) {
				var event = args[0];
				if(event !== 'end' && event !== 'error') return;

				proxy.callback(args, -1, function(obj, args, extra) {
					timer.end();

					topFunctions.add('postgresCalls', command, timer.ms);
					recordExtra(extra, timer);
				});
			});
		});
	}


	// Native, reinitialize probe 
	proxy.getter(obj, 'native', function(obj, ret) {
		proxy.after(ret, 'Client', function(obj, args, ret) {
			probe(ret.__proto__); 
		});
	});

	probe(obj.Client.prototype);
};
