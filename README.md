# Loopback Examples: Access Control

> **This Example is a Work in Progress**

## How to install and run the Access Control example app:

![](screenshots/screenshot-1.png?raw=true)
![](screenshots/screenshot-2.png?raw=true)
![](screenshots/screenshot-3.png?raw=true)

### Clone the project and install the server dependencies

```sh
git clone git@github.com:strongloop/loopback-example-access-control.git
cd loopback-example-access-control/server
npm install
```

### Run the app

> **Make sure you are in the server directory!**

```sh
node app
```

## How to build the Access Control example app:

### 0. Make sure you have `slc` version **>= 2.1.0**.

To install the latest version of `slc`:

```sh
npm install strong-cli -g
```

To check your version of `slc`:

```sh
slc version
```

Should print something similar to:

```
slc v2.1.0 (node v0.10.22)
```

### 1. Create the application using the `slc` command line tool.

```sh
mkdir -p access-control/client
cd access-control
slc lb project server
```

### 2. Define a `Bank` model to store a set of `Bank`s in the database.

```sh
cd server
slc lb model bank
```

### 3. Define an `Account` model to store user's bank accounts.

```sh
slc lb model account
```

### 4. Define a `Transaction` model to store user transactions.

```sh
slc lb model transaction
```

### 5. Setup relations between banks / accounts / users and transactions.

> See the [models.json](https://github.com/strongloop/loopback-example-access-control/blob/master/server/models.json#L20) file for the relations. Below is an example.

```JSON

  ...

  "user": {
    "options": {
      "base": "User",
      "relations": {
        "accessTokens": {
          "model": "accessToken",
          "type": "hasMany",
          "foreignKey": "userId"
        },
        "account": {
          "model": "account",
          "type": "belongsTo"
        },
        "transactions": {
          "model": "transaction",
          "type": "hasMany"
        }
      },

  ...

```

### 6. Secure all the APIs.

```sh
slc lb acl --all-models --deny --everyone
```

### 7. Open up specific APIs

```sh
slc lb acl --allow --everyone --read --model bank
slc lb acl --allow --everyone --call create --model user
slc lb acl --allow --owner --all --model user
slc lb acl --allow --owner --read --model account
slc lb acl --allow --owner --write --model account
```

### 8. Define the angular services for intergrating with LoopBack.

[See the actual source](https://github.com/strongloop/loopback-example-access-control/blob/master/client/js/services.js). Below is a basic example.

```js
// in client/js/services.js
angular.module('starter.services', ['ngResource'])
  .factory('User', ['$resource', function($resource) {
    return $resource('/api/users/:id', {id: '@id'}, {
      login: {
        method: 'POST',
        url: '/api/users/login'
      },
      logout: {
        method: 'POST',
        url: '/api/users/logout'
      }
    });
  }])
  .config(function ($httpProvider) {
    $httpProvider.interceptors.push('requestInterceptor');
  })
  .factory('requestInterceptor', function ($q, $rootScope) {
    return {
           'request': function (config) {
                console.log('config', config);
                if($rootScope.accessToken) {
                  config.headers.authorization = $rootScope.accessToken;
                }
                return config || $q.when(config);
            }
        }
    });
```

### 9. Create an Angular Controller for logging in and registering users.

[See the full source](https://github.com/strongloop/loopback-example-access-control/blob/master/client/js/controllers.js#L29). Below is a basic login / register controller.

```js
.controller('LoginCtrl', function($rootScope, $scope, $routeParams, User, $location) {
  $scope.registration = {};
  $scope.credentials = {};

  $scope.login = function() {
    $scope.loginResult = User.login($scope.credentials,
      function() {
        $rootScope.accessToken = $scope.loginResult.id;
        $rootScope.currentUserId = $scope.loginResult.userId;
        $location.path('/');
      },
      function(res) {
        $scope.loginError = res.data.error;
      }
    );
  }

  $scope.register = function() {
    $scope.user = User.save($scope.registration,
      function() {
        // success
      },
      function(res) {
        $scope.registerError = res.data.error;
      }
    );
  }
});
```

### 10. Implement the application views and controllers.

 - [See the source for angular controllers](https://github.com/strongloop/loopback-example-access-control/blob/master/client/js/controllers.js)
 - [See the source for angular views / templates](https://github.com/strongloop/loopback-example-access-control/tree/master/client/templates)
