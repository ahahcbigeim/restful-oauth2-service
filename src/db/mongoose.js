// Mongoose connection helper

// region Requirements & initialization

var emitter = new (require('events').EventEmitter)();

var mongoose = require('mongoose');
var init = require('../init');
var config = init.config;
var log = init.loggerDAL;

var dbUri = config.get('db:uri');
var dbOptions = config.get('db:options');

var connected = false;
var connecting = false;

// endregion

// region Functions

function connect(callback)
{
    var next = typeof callback === 'function' ? callback : function(){};
    if (connected)
    {
        log.debug('Mongoose has already connected.');

        next(null);
    }
    else if (connecting)
    {
        log.debug('Mongoose is already connecting. Awaiting...');

        emitter.on('connected', function(err)
        {
            if (err)
                log.error('Mongoose connection could not be established.');
            else
                log.debug('Mongoose connection established.');

            next(err);
        });
    }
    else
    {
        connecting = true;

        log.debug('Mongoose is connecting...');

        mongoose.connect(dbUri, dbOptions, function(err)
        {
            connecting = false;

            emitter.emit('connected', err);
            emitter.removeAllListeners('connected');

            var connectionError = err != null ? new Error(getConnectionErrorMessage(err)) : null;

            next(connectionError);
        });
    }
}

function getConnectionErrorMessage(err)
{
    var message = "Error while connecting to MongoDB";

    if (err)
    {
        message = message + ": ";

        if (err.message !== undefined)
        {
            // Handle mongoose framework error messages
            message = message + err.message;
        }
        else
        {
            // Handle error messages from underlying mongo driver
            message = message + err.err;
        }
    }

    return message;
}

// endregion

// region Connection event handlers

// Connecting
mongoose.connection.on('connecting', function()
{
    connected = false;
    connecting = true;

    log.debug('Connecting to MongoDB server %s...', dbUri);
});

// Successfully connected
mongoose.connection.on('connected', function()
{
    connected = true;

    log.debug('Connected to MongoDB server %s.', dbUri);
});


mongoose.connection.on('open', function(err)
{
    log.debug('Connection to MongoDB is opened.');
});

mongoose.connection.on('close', function(err)
{
    log.debug('Connection to MongoDB is closed.');
});


// Connection throws an error
mongoose.connection.on('error', function(err)
{
    connected = false;

    log.error(getConnectionErrorMessage(err));

    mongoose.connection.close();
});

// Disconnecting
mongoose.connection.on('disconnecting', function()
{
    connected = false;

    log.debug('Disconnecting to MongoDB server %s...', dbUri);
});

// Disconnected
mongoose.connection.on('disconnected', function()
{
    connected = false;

    log.debug('MongoDB server has disconnected.');
});

// endregion

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function()
{
    log.debug('Closing connection to MongoDB server due to the app termination.');

    mongoose.connection.close(function()
    {
        process.exit(0);
    });
});

// Initialize connection pool
connect();

// Export section
exports.mongoose = mongoose;
exports.ensureConnectionIsActive = function(callback)
{
    if (!connected)
    {
        connect(callback);
    }
    else
    {
        callback();
    }
};