var app = require('../app');
var user = app.models.user;
var account = app.models.account;
var transaction = app.models.transaction;
var TOTAL_TRANS = 100;
var ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

user.afterRemote('findById', function(ctx, user, next) {
  // override the result completely
  var result = ctx.result = {};

  user.transactions(function(err, transactions) {
    result.email = user.email;
    result.firstName = user.firstName;
    result.lastName = user.lastName;
    result.transactions = transactions;
    result.balance = calculateBalance(transactions);
    result.balance = calculateBalance(transactions);
    next();
  });
});

/*
 Calculate balance from an array of transactions
 */

function calculateBalance(transactions) {
  var balance = 0;

  transactions.forEach(function(transaction) {
    balance = transaction.add(balance);
  });

  return balance;
}

/*
 Create some test data.
 */

user.create({
  email: 'foo@bar.com',
  password: '123456',
  firstName: 'Joseph',
  lastName: 'Toblerone'
}, createAccount);

function createAccount(err, testUser) {
  account.create({
    balance: 0,
    userId: testUser.id
  }, function(err, acct) {
    testUser.accountId = acct.id;
    testUser.save(function() {
      createTransactions(err, acct, testUser);
    });
  });
}

function createTransactions(err, acct, u) {
  transaction.create(generateTransactions(acct, u, TOTAL_TRANS), function() {
    // done
  })
}

function generateTransactions(account, user, total) {
  var transactions = [];
  var transaction;

  while(transactions.length < total) {
    transaction = {
      pos: randCompany(),
      accountId: account.id,
      userId: user.id
    };

    if(rand(0, 100) >= 50) {
      transaction.debit = randDollarAmt(0, 999);
    } else {
      transaction.credit = randDollarAmt(0, 9999);
    }

    transaction.time = new Date(Date.now() - rand(0, ONE_YEAR));

    transactions.push(transaction);
  }

  return transactions;
}

function randDollarAmt(min, max) {
  max *= 100;
  var n = Math.floor(Math.random() * (max - min + 1) + min);
  return n / 100;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randCompany() {
  return TEST_COMPANIES[rand(0, TEST_COMPANIES.length - 1)];
}

var TEST_COMPANIES = [
  'Faux Mart',
  'Gas and Test',
  'Jasmine Tea',
  'TDD Inc'
];
