var app = require('../app');
var transaction = app.models.transaction;

transaction.prototype.add = function(n) {
  if(this.credit) {
    return n + this.credit;
  } else if(this.debit) {
    return n - this.debit;
  } else {
    return n;
  }
}
