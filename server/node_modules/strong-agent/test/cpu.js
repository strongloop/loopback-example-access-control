var should = require('should');

var cpuinfo = require('../lib/cpuinfo'),
	cpuutil = cpuinfo.cpuutil;

describe("cpu measurements", function() {

	// Does not consistently pass, cpuutil() is broken
	it("gives metrics in the 0-100 range", function(done) {

		// cpuutil() takes at least a second to generate
		setTimeout(validate_metrics, 1000);
		setTimeout(validate_metrics, 2000, done);

		function validate_metrics(finish) {
			function cpu_metrics(p,u,s) {
				p.should.be.within(0, 100);
				u.should.be.within(0, 100);
				s.should.be.within(0, 100);
				if (finish) {
					finish();
				}
			}
			cpuutil(cpu_metrics);
		}
	});
});
