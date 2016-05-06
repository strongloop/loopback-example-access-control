// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-example-access-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

module.exports = function(Project) {
  // listProjects
  Project.listProjects = function(cb) {
    Project.find({
      fields: {
        balance: false
      }
    }, cb);
  };
  Project.remoteMethod('listProjects', {
    returns: {arg: 'projects', type: 'array'},
    http: {path:'/list-projects', verb: 'get'}
  });

  // donate
  Project.donate = function(id, amount, cb) {
    Project.findById(id, function(err, project) {
      if (err) return cb(err);

      project.balance += amount;
      project.save();

      cb(null, true);
    });
  };
  Project.remoteMethod('donate', {
    accepts: [
      {arg: 'id', type: 'number'},
      {arg: 'amount', type: 'number'},
    ],
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/donate', verb: 'post'}
  });

  // withdraw
  Project.withdraw = function(id, amount, cb) {
    Project.findById(id, function(err, project) {
      if (err) return cb(err);

      project.balance = project.balance >= amount ?
          project.balance - amount : 0;
      project.save();

      cb(null, true);
    });
  };
  Project.remoteMethod('withdraw', {
    accepts: [
      {arg: 'id', type: 'number'},
      {arg: 'amount', type: 'number'},
    ],
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/withdraw', verb: 'post'}
  });
};
