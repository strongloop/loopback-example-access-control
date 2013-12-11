var events = require('events');
var util = require('util');
var _ = require('underscore');

var measured = require('measured')
  , Histogram = measured.Histogram;


var UrlAggregator = function(options) {
	if (!(this instanceof UrlAggregator)) return new UrlAggregator(options);
	events.EventEmitter.call(this);
	var self = this;
	
	switch (typeof options) {
	case 'number':
		options = {
			range: options
		}; // expiry only
		break;
	case 'undefined':
		options = {};
		break;
	}
	
	self._range = options.range || 60*60*1000;
	self._interval = options.interval || 60*1000;
	self._maxSize = options.maxSize || 10; 
	
	self._windows = [];
};

util.inherits(UrlAggregator, events.EventEmitter);


UrlAggregator.prototype._addWindow = function(now){
	this._windows.push({
		start: now,
		topUrls: []
	});
};


UrlAggregator.prototype._expireWindows = function(){
	var now = (new Date).getTime();
	this._windows = _.reject(this._windows, function(window){
		return (now - window.start) > this._range;
	}, this);
}


UrlAggregator.prototype._addUrlAtTimestamp = function(timestamp, url, wallTime, cpuTime, tiers){
	var self = this;
	var now = (new Date).getTime();
	var data = [timestamp, url, wallTime, cpuTime, tiers];
	
	if (self._windows.length === 0)
		self._addWindow(now);
	
	var t1 = now - _.last(self._windows).start; // time since last window started
	if (t1 >= self._interval)
		self._addWindow(now);

	self._expireWindows();
	
	_.each(self._windows, function(window, i){
		if (i === 0) { // current window
			if (self._updateList(window.topUrls, data)){
				process.nextTick(function(){
					self.emit('update', _.first(self._windows));
				});
			}
		}
		else {
			self._updateList(window.topUrls, data);
		}
	});
	
	process.nextTick(function(){
		self.emit('url', [timestamp, url, wallTime, cpuTime]);
	});
};


UrlAggregator.prototype.addUrl = function(url, wallTime, cpuTime){
	var self = this;
	var now = (new Date).getTime();
	
	self._addUrlAtTimestamp(now, url, wallTime, cpuTime);
};

UrlAggregator.prototype._updateList = function(list, data){
	var self = this;
	var update = false;

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
		if (list.length < self._maxSize) {
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
	
	return update;
};


module.exports = UrlAggregator;