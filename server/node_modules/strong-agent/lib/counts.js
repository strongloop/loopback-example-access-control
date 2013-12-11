var nf;

var stats = require('./node-measured').createCollection('callCounts');

exports.init = function() {
	nf = global.nodefly;
	start();
};

exports.sample = function(code) {
	stats.meter(code).mark();
};

function start() {
	setInterval(function () {
		var data = stats.toJSON();
		data._ts = nf.millis();
		nf.emit('callCounts', data);
		stats.reset();
	}, 60 * 1000);
}
