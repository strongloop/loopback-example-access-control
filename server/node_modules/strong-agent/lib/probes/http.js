var crypto = require('crypto');
var util = require('util');
var nf = require('../nodefly');
var proxy = require('../proxy');
var samples = require('../samples');
var tiers = require('../tiers');
var _ = require('underscore');
var topFunctions = require('../topFunctions');
var graphHelper = require('../graphHelper');

var config = global.nodeflyConfig;

module.exports = function(http) {
	
	// server probe
	proxy.before(http.Server.prototype, [ 'on', 'addListener' ], function(obj,
			args) {
		
		// store ref to server so we can pull current connections
		nf.server_obj = obj;

		if (nf.server_obj.connCount === undefined)
			nf.server_obj.connCount = 0;

		if (args[0] !== 'request')
			return;

		proxy.callback(args, -1, function(obj, args) {
			nf.server_obj.connCount++;

			if (nf.paused)
				return;

			var req = args[0];
			var res = args[1];
			var timer = samples.timer("HTTP Server", req.url, true);
			req.tiers = timer.tiers = nf.extra = {};

			var graph = nf.graph = { nodes: [ { name: req.url } ], links: [] };
			req.graph = graph;
			var currentNode = nf.currentNode = 0;

			proxy.before(req, [ 'on', 'addListener' ], function(req, args) {
				proxy.callback(args, -1, function(obj, args) {
					// noop
				});
			});

			proxy.after(res, 'end', function(obj, args) {
				timer.end();

				try {
					graph.nodes[0].value = timer.ms;
					topFunctions.add('httpCalls', req.url, timer.ms, timer.cputime, timer.tiers, graph);
					tiers.sample('http', timer);
				} catch (e) {
					console.log("problems!!!\n", e.stack);
					process.exit(0);
				}

				timer.tiers.closed = true;
			}); // res.end
		},
		function(obj,args){
			nf.graph = undefined;
			nf.currentNode = undefined;
			nf.extra = undefined;
		}); // callback
		
	}); //server 

	// client probe
	function getClientResponseHandler(url, host, timer, graphNode) {
		return function handleResponseCb(obj, args, extra) {
			var res = args[0];
			
			proxy.before(res, [ 'on', 'addListener', 'once'], function(res, args) {
				if (args[0] !== 'end') return;
				
				proxy.callback(args, -1, function(obj, args, extra) {
					timer.end();
					//if (!time || !timer.done()) return;
					
					topFunctions.add('externalCalls', url, timer.ms, timer.cputimer);
					graphHelper.updateTimes(graphNode, timer);

					if (extra) {
						extra[host] = extra[host] || 0;
						extra[host] += timer.ms;

						if (extra.closed) {
							if (typeof host === 'string')
								tiers.sample(host + '_out', timer);
						}
						else {
							if (typeof host === 'string')
								tiers.sample(host + '_in', timer);
						}

					}
				}); // res end cb
				
			}); // res end
		}
	}
	

	// handle http.request with callback
	proxy.before(http, 'request', function(obj, args) {
		var opts = args[0];
		var cb = args[1];
		
		if (typeof cb != 'function') return;

		if (opts.headers || opts._headers) {
			// get the url
			var headers = opts._headers || opts.headers;
			var method = opts.method || '';
			var host = headers.Host || headers.host || '';
			var path = opts.path;
			var url = util.format('%s http://%s%s', method, host, path);

			// don't track the agent calling home
			var nfServer = config.server;
			var re = new RegExp(host);
			if (nfServer.match(re)) return;

			var timer = samples.timer("HTTP Client", url, true);
			var graphNode = graphHelper.startNode('Outgoing HTTP', url, nf);

			proxy.callback(args, -1, getClientResponseHandler(url, host, timer, graphNode));
			if (graphNode) nf.currentNode = graphNode.prevNode;
		}
	});



	// handle ClientRequest, evented.
	if (http.ClientRequest && http.ClientRequest.prototype) {

		proxy.before(http.ClientRequest.prototype, ['on', 'addListener', 'once'], function onResponse(req, args){
			if (args[0] !== 'response')
				return;
			

			if (req._headers || req.headers) {
				var headers = req._headers || req.headers;
				var method = req.method || '';
				var host = headers.Host || headers.host || '';
				var path = req.path;
				var url = util.format('%s http://%s%s', method, host, path);

				// don't track the agent calling home
				var nfServer = config.server;
				var re = new RegExp(host);
				if (nfServer.match(re)) return;

				var timer = samples.timer("HTTP Server", url, true);
				var graphNode = graphHelper.startNode('Outgoing HTTP', url, nf);
				
				proxy.callback(args, -1, getClientResponseHandler(url, host, timer, graphNode));
				if (graphNode) nf.currentNode = graphNode.prevNode;
			}

		}); // before on/add/once

	} // http.ClientRequest

	
};