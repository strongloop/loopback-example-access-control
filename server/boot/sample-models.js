module.exports = function(app) {
  var User = app.models.user;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;
  var Team = app.models.Team;

  User.create([
    {username: 'John', email: 'john@doe.com', password: 'opensesame'},
    {username: 'Jane', email: 'jane@doe.com', password: 'opensesame'},
    {username: 'Bob', email: 'bob@projects.com', password: 'opensesame'}
  ], function(err, users) {
    if (err) throw err;

    console.log('Created users:', users);

    // create project 1 and make john the owner
    users[0].projects.create({
      name: 'project1',
      balance: 100
    }, function(err, project) {
      if (err) throw err;

      console.log('Created project:', project);

      // add team members
      Team.create([
        {ownerId: project.ownerId, memberId: users[0].id},
        {ownerId: project.ownerId, memberId: users[1].id}
      ], function(err, team) {
        if (err) throw err;

        console.log('Created team:', team);
      });
    });

    //create project 2 and make jane the owner
    users[1].projects.create({
      name: 'project2',
      balance: 100
    }, function(err, project) {
      if (err) throw err;

      console.log('Created project:', project);

      //add team members
      Team.create({
        ownerId: project.ownerId,
        memberId: users[1].id
      }, function(err, team) {
        if (err) throw err;

        console.log('Created team:', team);
      });
    });

    //create the admin role
    Role.create({
      name: 'admin'
    }, function(err, role) {
      if (err) throw err;

      console.log('Created role:', role);

      //make bob an admin
      role.principals.create({
        principalType: RoleMapping.USER,
        principalId: users[2].id
      }, function(err, principal) {
        if (err) throw err;

        console.log('Created principal:', principal);
      });
    });
  });
};
