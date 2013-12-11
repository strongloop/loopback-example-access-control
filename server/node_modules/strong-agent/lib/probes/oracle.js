var nf = require('../nodefly');
var proxy = require('../proxy');
var samples = require('../samples');
var topFunctions = require('../topFunctions');
var counts = require('../counts');
var tiers = require('../tiers');
var graphHelper = require('../graphHelper');


module.exports = function(oracle) {

	proxy.after(oracle, 'connectSync', function(obj, args, connection){
		proxy_connection(connection);
	});

	proxy.before(oracle, 'connect', function(obj, args){
		//console.log(oracle, arguments);
		proxy.callback(args, -1, function(obj, args){
			var connection = args[1];
			proxy_connection(connection);
		});
	});
};


function proxy_connection(connection)
{
	if (!connection) return;

	proxy.around(connection, 'executeSync', 
	// before
	function(obj, args, locals){
		query_before(args, locals);
	}, 
	// after
	function(obj, args, ret, locals){
		query_after(locals);
	});

	proxy.before(connection, ['execute'], function(obj, args){
		// query starts
		var locals = {};
		query_before(args, locals);
		proxy.callback(args, -1, function(obj, args){
			// query ends 
			query_after(locals);
		});
	});

	['commit','rollback'].forEach(function(method){
		proxy.before(connection, method, function(obj, args){
			// query starts
			var locals = {command: method};
			query_before(args, locals);
			proxy.callback(args, -1, function(obj, args){
				// query ends 
				query_after(locals);
			});
		});
	});
}

function query_before(args, locals)
{
	locals.command = locals.command || (args.length > 0 ? args[0] : undefined);
	locals.timer = samples.timer("Oracle", "query");
	locals.graphNode = graphHelper.startNode('Oracle', locals.command, nf);
	if (locals.graphNode) {
		nf.currentNode = locals.graphNode.prevNode;
	}
	counts.sample('oracle');
}

function query_after(locals)
{
	locals.timer.end();
	topFunctions.add('oracleCalls', locals.command, locals.timer.ms);
	graphHelper.updateTimes(locals.graphNode, locals.timer);
	tiers.sample('oracle', locals.timer);
}
