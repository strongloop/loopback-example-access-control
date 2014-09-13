module.exports = function(app) {
  var accounts = [
    { type: 'chequing' },
    { type: 'savings' }
  ];
  var dataSource = app.dataSources.db;
  dataSource.automigrate('account', function(er) {
    if (er) throw er;
    var Account = app.models.account;
    var count = accounts.length;
    accounts.forEach(function(account) {
      Account.create(account, function(er, result) {
        if (er) return;
        console.log('Record created:', result);
        count--;
        if (count === 0) return console.log('done');
      });
    });
  });
};
