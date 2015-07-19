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
    var email = req.body.email,
        twofactor = req.body.twofactor;

    app.models.User.loginWithCode({
      email: email,
      twofactor: twofactor
    }, function(err, token) {
      if (err)
        return res.render('index', {
          email: email,
          loginFailed: true
        });

      token = token.toJSON();

      res.render('projects', {
        username: token.user.username,
        accessToken: token.id
      });
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
