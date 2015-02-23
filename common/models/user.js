var speakeasy = require('speakeasy');

module.exports = function(User) {
    
    User.login = function(credentials, include, fn) {
        fn(new Error('This application requires two-factor authentication.'));
    };
    
    User.requestCode = function(credentials, fn) {
        var self = this,
            now = (new Date()).getTime(),
            defaultError = new Error('login failed');
        
        defaultError.statusCode = 401;
        defaultError.code = 'LOGIN_FAILED';
        
        if (!credentials.email || !credentials.password) {
            return fn(defaultError);
        }
        
        self.findOne({where: { email: credentials.email }}, function(err, user) {
            if (err) {
                return fn(defaultError);
            } else if (user) {
                user.hasPassword(credentials.password, function(err, isMatch) {
                    if (err) {
                        return fn(defaultError);
                    } else if (isMatch) {
                        
                        var code = speakeasy.totp({key: 'APP_SECRET' + credentials.email, time: now});
                        
                        console.log('Two factor code for ' + credentials.email + ': ' + code);
                        
                        // TODO: hook into your favorite SMS API and send your user the code!
                        
                        fn(null, now);
                        
                    } else {
                        return fn(defaultError);
                    }
                });
            } else {
                return fn(defaultError);
            }
        });
    };
    
    User.loginWithCode = function(credentials, fn) {
        var self = this,
            defaultError = new Error('login failed');
        
        defaultError.statusCode = 401;
        defaultError.code = 'LOGIN_FAILED';
        
        if (!credentials.email || !credentials.twofactor || !credentials.timestamp) {
            return fn(defaultError);
        }
        
        self.findOne({ where: { email: credentials.email } }, function(err, user) {
            if (err) return fn(err);
            if (!user) return fn(defaultError);
            
            var oldCode = speakeasy.totp({key: 'APP_SECRET' + credentials.email, time: credentials.timestamp});
            
            // TODO: check code
            if (oldCode !== credentials.twofactor) {
                return fn(defaultError);
            }
            
            user.createAccessToken(86400, function(err, token) {
                if (err) return fn(err);
                token.__data.user = user;
                fn(err, token);
            });
        });
    };
    
    
    User.remoteMethod(
        'requestCode',
        {
            description: 'Request a two-factor code for a user with email and password',
            accepts: [
                {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}}
            ],
            returns: {arg: 'timestamp', type: 'string'},
            http: {verb: 'post'}
        }
    );

    User.remoteMethod(
        'loginWithCode',
        {
            description: 'Login a user with email and two-factor code',
            accepts: [
                {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}}
            ],
            returns: {
                arg: 'accessToken', type: 'object', root: true,
                description: 'The response body contains properties of the AccessToken created on login.\n'
            },
            http: {verb: 'post'}
        }
    );
    
};
