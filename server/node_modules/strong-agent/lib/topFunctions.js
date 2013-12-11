var events = require('events');
var util = require('util');
var _ = require('underscore');
var config = global.nodeflyConfig;

var MAX_SIZE = 10;

var TopFunctions = function() {
	if (!(this instanceof TopFunctions)) return new TopFunctions();
	events.EventEmitter.call(this);
	var self = this;
	this._resetData();

	setInterval(function() {
		self.emit('update', self._data);
		process.nextTick(function(){ self._resetData(); });
	}, config.collectInterval || 60*1000);

};

util.inherits(TopFunctions, events.EventEmitter);


TopFunctions.prototype._resetData = function _resetData() {
	this._data = {};
}


TopFunctions.prototype.add = function add(collectionName, url, wallTime, cpuTime, tiers, graph) {
	var now = Date.now();
	var entry = [now, url, wallTime, cpuTime, tiers, graph];

	this._update(collectionName, entry);
}


TopFunctions.prototype._update = function _update(collectionName, data) {
	var update = false;

	var list;
	if (this._data[collectionName]) {
		list = this._data[collectionName].list;
	}
	else {
		this._data[collectionName] = { start: Date.now(), collectionName: collectionName, list: [] };
		list = this._data[collectionName].list;
	}

	// on the list
	var found = false;
	_.each(list, function(item){
		if (item[1] == data[1]){
			found = true;
			if (item[2] < data[2]){
				_.extend(item, data);
				update = true;
			}
		}
	});
	
	// not on list
	if (!found){
		// list has room
		if (list.length < MAX_SIZE) {
			list.push(data);
			update = true;
		}
		else {
			// it ranks on list (it's walltime is greater than the last item on the list
			if (data[2] > _.last(list)[2] ){
				list.pop();
				list.push(data);
				update = true;
			}
		}
	}
	
	// we changed the content of the window, sort and emit time
	if (update) {
		list.sort(function(a,b){
			if (a[2] < b[2])
				return 1;
			if (a[2] == b[2])
				return 0;
			if (a[2] > b[2])
				return -1;
		});
	}
};

var topFunctions = new TopFunctions();

module.exports = topFunctions;

