var debug = require('debug')('boot:create-role-resolver');

module.exports = function(app) {
  var Role = app.models.Role;
  Role.registerResolver('teamMember', function(role, context, cb) {
    var userId = context.accessToken.userId;
    if (!userId) {
      return cb(null, false); //do not allow anonymous users
    }
    // check if userId is in team table for the given project id
    context.model.findById(context.modelId, function(er, project) {
      var Team = app.models.Team;
      Team.find({
        where: {
          ownerId: project.ownerId,
          memberId: userId
        }
      }, function(er, team) {
        if (er) {
          debug(er);
          return cb(null, false);
        }
        debug(team);
        if (team.length === 0) {
          return cb(null, false); //false = is not a team member
        }
        cb(null, true); //true = is a team member
      });
    });
  });
};
