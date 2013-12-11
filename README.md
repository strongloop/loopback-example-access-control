# Loopback Examples: Access Control

## How to build the Access Control example app:

0. Make sure you have `slc` version **>= 2.0.0**.

```sh
npm install strong-cli -g
```

1. Create the application using the `slc` command line tool.

```sh
mkdir -p access-control/client
cd access-control
slc lb project server
```

2. Define a `Bank` model to store a set of `Bank`s in the database.

```sh
cd server
slc lb model bank
```

3. Define an `Account` model to store user's bank accounts.

```sh
slc lb model account
```

4. Define a `Transaction` model to store user transactions.

```sh
slc lb model transaction
```

5. Setup the relationships between banks / accounts / users and transactions.

```sh
slc lb relation bank --has-many user
slc lb relation bank --has-many account
slc lb relation account --has-many transaction
slc lb relation user --belongs-to account 
```

6. Secure all the APIs.

```sh
slc lb acl --all-models --deny --everyone
```

7. Open up specific APIs

```sh
slc lb acl --allow --everyone --read --model bank
slc lb acl --allow --everyone --call create --model user
slc lb acl --allow --owner --all --model user
slc lb acl --allow --owner --read --model account
slc lb acl --allow --owner --write --model account
```

8. Define the angular resources.

```js
// in client/js/services.js
app.factory('Bank', function($resource) {
  return $resource('/api/banks/:id', {id: '@id'});
});
app.factory('Account', function($resource) {
  return $resource('/api/accounts/:id', {id: '@id'});
});
app.factory('User', function($resource) {
  var actions = {
    login: {
      method: 'POST',
      url: '/api/user/login'
    }
  };

  return $resource('/api/user/:id', {id: '@id'}, actions);
});
app.factory('AccessToken', function($resource) {
  return $resource('/api/access-token/:id', {id: '@id'});
});
app.factory('Transaction', function($resource) {
  return $resource('/api/transactions/:id', {id: '@id'});
});
```

9. Registering a User

```js
// in access-control/client/js/controllers.js
function RegisterCtrl($scope, User) {
  var user = $scope.user = {};
  $scope.register = function(){
    $scope.registrationResult = User.post(user);
  }
}
```

```js
// in access-control/server/models/user.js
var app = require('../app');
var User = app.models.User;

User.beforeRemote('create', function(ctx, next, method) {
  var user = new User(ctx.instance);
  user.hasValidAccount(next);
});

var accountError = new Error('account does not exist or was not specified');
accountError.statusCode = 422;

User.prototype.hasValidAccount = function(cb) {
  if(this.accountId) {
    this.account(function(err, account) {
      if(err) {
        return cb(err); 
      } else if(account) {
        return cb();
      } else {
        return cb(accountError);
      }
    });
  } else {
    return cb(accountError);
  }
}
```

10. Logging in

```js
// in access-control/client/js/controllers.js
function LoginCtrl($scope, User) {
  var credentials = $scope.credentials = {};
  $scope.login = function(){
    $scope.loginResult = User.$login(credentials);
  }
}
```
