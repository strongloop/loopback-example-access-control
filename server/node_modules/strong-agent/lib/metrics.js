var config = global.nodeflyConfig;

var nf;
var metrics = {};

exports.init = function() {
	nf = global.nodefly;
	setInterval(function() {
		try {
			release();
		} catch(e) {
			nf.error(e);
		}
	}, config.metricsInterval);
};


exports.add = function(scope, name, value, unit, op, session) {

	if (!scope) scope = 'default-scope';
	
	process.nextTick(function(){
		var key = scope + ':' + name;
		if (!metrics[key]) {
			metrics[key] = {
			scope: scope,
			name: name,
			value: 0,               			
			_count: 0,
			unit: unit,
			op: op,
			session: session
			};
		}

		var obj = metrics[key];
		obj.value = value;
	});
};


var emit = function(obj) {
	try {
		delete obj._count;
		//obj._ts = nf.millis();
		nf.emit('metric', obj);
	} catch(err) {
		nf.error(err);
	}
};

var release = function() 
{
	for (var key in metrics) {
		emit(metrics[key]);
	}
	metrics = {};
};
