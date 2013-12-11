var Timer = require('./timer');

module.exports.timer = function(scope, command)
{
	var t = new Timer(scope, command);
	t.start();
	return t;
}