module.exports = process.env.UHURA_COV
	? require('./lib-cov/uhura')
	: require('./lib/uhura');