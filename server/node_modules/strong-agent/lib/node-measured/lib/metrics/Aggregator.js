module.exports = Aggregator;
function Aggregator(properties) {
  properties = properties || {};

  this._count      = 0;
  this._currentSum = 0;
  this._avg = 0;
}

Aggregator.prototype.mark = function(n) {
  this._count += 1;
  this._currentSum += n;
};

Aggregator.prototype.toJSON = function() {
  var json = {
    'sum'   : this._currentSum,
    'count' : this._count,
    'avg'   : this._calculateAvg(),
  };
  return json;
};

Aggregator.prototype.reset = function(){
  this._currentSum = 0;
  this._count = 0;	
}

Aggregator.prototype._calculateAvg = function() {
  return (this._count != 0) 
    ? this._currentSum/this._count 
    : 0;
}