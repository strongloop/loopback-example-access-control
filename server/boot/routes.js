module.exports = function(app) {
  var router = app.loopback.Router();

  router.get('/', function(req, res) {
    res.render('index', {
      loginFailed: false
    });
  });

  router.get('/projects', function(req, res) {
    res.render('projects');
  });

  router.post('/projects', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    app.models.User.login({
      email: email,
      password: password
    }, function(err, token) {
      if (err) {
        res.render('index', {
          email: email,
          password: password,
          loginFailed: true
        });
      } else {
        app.models.User.findOne({where: {id: token.userId}}, function (err, user) {
          res.render('projects', {
            username: user.username,
            accessToken: token.id
          });
        });
      }
    });
  });

  router.get('/logout', function(req, res) {
    var AccessToken = app.models.AccessToken;
    var token = new AccessToken({id: req.query.access_token});
    token.destroy();
    res.redirect('/');
  });

  app.use(router);
};
