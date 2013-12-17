var loopback = require('loopback');
var lt = require('loopback-testing');
var app = require('../');
var assert = require('assert');
var USER = {email: 'test@test.test', password: 'test'};
var CURRENT_USER = {email: 'current@test.test', password: 'test'};

describe('REST - /users', function () {
  lt.beforeEach.withApp(app);

  lt.describe.whenLoggedInAsUser(CURRENT_USER, function() {
    it('should have an acct property', function() {

    });
  });
});
