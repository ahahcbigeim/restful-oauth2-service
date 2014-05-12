var async = require('async');
var redisClient = require('./db/redisclient')();
var redisClientManager = new (require('./db/dal/clientmanager'))();

var log = require('./init').logger;

var testData =
{
    client:
    {
        name: 'OfficialClient',
        secret: 's3cr3t'
    },
    token: 'oauth-cc-token'
}

function clearDatabase(callback)
{
    redisClient.FLUSHDB(function (err, result)
    {
        callback(!err && result === "OK" ? null : new Error('Redis database was not cleared.'));
    });
}

function registerTestClient(callback)
{
    // Register test client
    log.info('Test: registering test client...');

    redisClientManager.addClient(testData.client.name, testData.client.secret, function(err, result)
    {
        //console.log('addClient:', arguments);
        if (err)
            callback(err, result);
        else
            redisClientManager.getClient(testData.client.name, function(err, result)
            {
                //console.log('getClient:', arguments);
                callback(err, result);
            });
    });
}

function addTestToken(token, callback)
{
    // Put test token to Redis
    log.info('Test: adding test client token...');

    redisClientManager.addClientToken(testData.token, testData.client.name, function(err, result)
    {
        //console.log('addClientToken:', arguments);
        callback(err, result);
    });
}

function fill(callback)
{
    redisClient.connect(function(err)
    {
        if (err)
        {
            callback(err);
        }
        else
        {
            async.waterfall(
            [
                clearDatabase,
                registerTestClient,
                addTestToken
            ], callback);
        }
    });
}

if (module.parent)
{
    // Referenced with require()
    module.exports = fill;
}
else
{
    // Executed directly
    fill(function(err)
    {
        if (err)
        {
            log.error('Test token creation failed.');
            log.error(err.stack);
            process.exit(1);
        }

        log.debug('Test token created.');
        process.exit(0);
    });
}