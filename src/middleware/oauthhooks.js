// region Requirements

var init = require('../init');
var log = init.logger;

var hash = require('../helpers/hash');

var redisClientManager = new (require('../db/dal/clientmanager'))();

// endregion

exports.grantClientToken = function (credentials, req, callback)
{
    log.debug('Auth: validating client \'%s\' to grant token to..', credentials.clientId);

    // Find the combination of clientId and clientSecret
    redisClientManager.getClient(credentials.clientId, function (err, client)
    {
        if (err)
        {
            callback(err);
        }
        else if (client && client.enabled &&
                 // client.secret == credentials.clientSecret
                 hash.checkPassword(credentials.clientSecret, client.secret, client.salt)
             )
        {
            // The username/password combination is VALID

            var token = hash.generateToken(credentials.clientId + ':' + credentials.clientSecret);

            redisClientManager.addClientToken(token, credentials.clientId, function(err)
            {
                //todo: do something with the previous tokens generated for this client
                callback(err, token);
            });
        }
        else
        {
            callback(null);
        }
    });
};

exports.authenticateToken = function (token, req, callback)
{
    log.debug('Auth: validating token \'%s\'..', token);

    // Check whether the token can be found in Redis
    redisClientManager.getClientByToken(token, function (err, client)
    {
        if (err)
        {
            callback(err, false);
        }
        else if (client  && client.enabled)
        {
            // Remember the client name
            req.clientId = client.name;

            // The token is VALID
            callback(null, true);
        }
        else
        {
            // The token is INVALID
            callback(null, false);
        }
    });
};