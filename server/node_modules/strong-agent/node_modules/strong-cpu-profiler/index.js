var base = process.env.STRONG_PROFILER_COV ? 'lib-cov' : 'lib';
module.exports = require('./' + base + '/strong-profiler');
