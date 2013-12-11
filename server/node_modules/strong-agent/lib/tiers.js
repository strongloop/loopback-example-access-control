var measured = require('measured');
var inst;

function Tiers () {
	this.stats = measured.createCollection('tiers');
	this.config = global.nodeflyConfig;
	this.nf = global.nodefly;
	this.start();
}
module.exports = Tiers;

// Entry point
Tiers.init = function () {
	inst = new Tiers;
	return inst;
};

// Compatibility hack
Tiers.sample = function (code, time) {
	inst && inst.sample(code, time);
};

// Put real sampler on contructed object
Tiers.prototype.sample = function (code, time) {
	this.stats.histogram(code).update(time.ms);
};

// Expose this on the Tiers constructor, so we can stub it out
Tiers.prototype.start = function () {
	var self = this;
	setInterval(function () {
		var data = self.stats.toJSON();
		self.nf.emit('tiers', data);
		Object.keys(data.tiers).forEach(function (key) {
			self.stats.histogram(key).reset();
		});
	}, self.config.tiersInterval);
};
