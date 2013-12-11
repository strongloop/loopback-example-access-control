var debug;
if (process.env.NODEFLY_DEBUG && /proxy/.test(process.env.NODEFLY_DEBUG)) {
	debug = function(x) { console.error('     PROXY: %s', x); };
} else {
	debug = function() { };
}

var EventEmitter = require('events').EventEmitter;

var nodefly;

exports.init = function() {
	nodefly = global.nodefly;
}

function before(obj, meths, hook) {
	if(!Array.isArray(meths)) meths = [meths];

	meths.forEach(function(meth) { 
		var orig = obj[meth];
		if(!orig) return;

		var newFunc = function() {
			try { hook(this, arguments, meth); } catch(e) { nodefly.error(e); }
			var ret = orig.apply(this, arguments);
			if (obj[meth].__patched__ !== true) {
				before(obj,meths,hook);
			}
			return ret;
		};

		if (!obj[meth].__patched__) {
			obj[meth] = newFunc;
			obj[meth].__patched__ = true;
		}
	});
};

exports.before = before;

exports.after = function(obj, meths, hook) {
	if(!Array.isArray(meths)) meths = [meths];

	meths.forEach(function(meth) {
		var orig = obj[meth];
		if(!orig) return;

		obj[meth] = function() {
			var ret = orig.apply(this, arguments);
			try { hook(this, arguments, ret); } catch(e) { nodefly.error(e) }
			return ret;
		};
	});
};

exports.callback = function(args, pos, hookBefore, hookAfter, evData) {
	if(args.length <= pos) return false;
	if (pos === -1) {
		// search backwards for last function
		for (pos = args.length - 1; pos >= 0; pos--) {
			if (typeof args[pos] === 'function') {
				break;
			}
		}
	}

	// create closures on context vars
	var extra = nodefly.extra;
	var graph = nodefly.graph;
	var currentNode = nodefly.currentNode;

	var orig = (typeof args[pos] === 'function') ? args[pos] : undefined;
	if(!orig) return;

	var functionName = orig.name || 'anonymous';

	args[pos] = function() {		
		if (extra) nodefly.extra = extra;
		if (graph) nodefly.graph = graph;
		if (currentNode != undefined) nodefly.currentNode = currentNode;

		if(hookBefore) try { hookBefore(this, arguments, extra, graph, currentNode); } catch(e) { nodefly.error(e); }

		if (evData) debug(evData.emitterName + ' \'' + evData.eventName + '\' event -> ' + functionName + '()');
		var ret = orig.apply(this, arguments);
		if(hookAfter) try { hookAfter(this, arguments, extra, graph, currentNode); } catch(e) { nodefly.error(e); }

		if (extra) nodefly.extra = undefined;
		if (graph) nodefly.graph = undefined;
		if (currentNode != undefined) nodefly.currentNode = undefined;
		return ret;
	};

	orig.__proxy__ = args[pos];

	args[pos].__name__ = 'BEFORE_' + functionName;
};

exports.around = function(obj, meths, hookBefore, hookAfter) {
	if(!Array.isArray(meths)) meths = [meths];

	meths.forEach(function(meth) {
		var orig = obj[meth];
		if(!orig) return;

		obj[meth] = function() {
			var locals = {};
			try { hookBefore(this, arguments, locals); } catch(e) { nodefly.error(e) }
			var ret = orig.apply(this, arguments);
			try { hookAfter(this, arguments, ret, locals); } catch(e) { nodefly.error(e) }
			return ret;
		};
	});
};

exports.getter = function(obj, props, hook) {
	if(!Array.isArray(props)) props = [props];

	props.forEach(function(prop) {
		var orig = obj.__lookupGetter__(prop);
		if(!orig) return;

		obj.__defineGetter__(prop, function() {
			var ret = orig.apply(this, arguments);
			try { hook(this, ret); } catch(e) { nodefly.error(e) }
			return ret;
		});
	});
};


function remove_wrapper(obj, args) 
{
	if (args.length > 1 && args[1] && args[1].__proxy__) {
		args[1] = args[1].__proxy__;
	}
}

if(!EventEmitter.prototype.__patched__) {
	/* make sure a wrapped listener can be removed */
	exports.before(EventEmitter.prototype, 'removeListener', remove_wrapper);
	exports.after(EventEmitter.prototype, 'removeListener', remove_wrapper);

	EventEmitter.prototype.__patched__ = true;
}


