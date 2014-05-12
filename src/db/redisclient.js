// region Requirements

var redis = require('redis');

var emitter = new (require('events').EventEmitter)();

var init = require('../init');
var log = init.loggerDAL;
var config = init.config.get('redis') || {};

// endregion

// region Setting up client

var connected = false;

var client = redis.createClient(config.port, config.host, config.options);

// Set up event handlers to monitor Redis connection state
client.on('connect', function()
{
    connected = false;
    log.info('Redis: connecting to \'%s:%d\'...', config.host, config.port);
});
client.on('ready', function()
{
    connected = true;
    log.debug('Redis: connection is established and ready to use.');

    client.select(config.db);

    emitter.emit('connected', null);
    emitter.removeAllListeners('connected');
});
client.on('reconnecting', function()
{
    //console.log(arguments);
    connected = false;
    log.debug('Redis: reconnecting...');
});
client.on('error', function(err)
{
    connected = false;
    log.error(err.message);
    //console.log('Redis: an error encountered while connecting to server.');

    if (client.max_attempts && client.attempts >= client.max_attempts)
    {
        emitter.emit('fail', err);
        emitter.removeAllListeners('fail');
    }
});
client.on('end', function()
{
    connected = false;
    log.debug('Redis: an established connection has closed.');
});

client.connect = function(callback)
{
    var next = typeof callback === 'function' ? callback : function(){};

    if (connected)
    {
        next(null);
    }
    else
    {
        emitter.on('connected', function(err)
        {
            if (err)
                log.error('Redis connection could not be established.');
            else
                log.debug('Redis connection established.');

            next(err);
        });

        emitter.on('fail', next);
    }
};

// endregion

module.exports = function()
{
    return client;
};