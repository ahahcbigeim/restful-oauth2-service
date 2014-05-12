// Global init and variables

// region Requirements

var winston = require('winston');
var config = require("./config");

// endregion

// region initialization

var ENV = process.env.NODE_ENV;

// Init loggers
var logger = new (winston.Logger)
(
    {
        transports:
            [
                new (winston.transports.Console)
                (
                    {
                        'colorize': true,
                        'level': ENV == 'production' ? 'error' : 'debug',
                        'timestamp': true
                    }
                )
            ]
    }
);

var loggerDAL = new (winston.Logger)
(
    {
        transports:
            [
                new (winston.transports.Console)
                (
                    {
                        'colorize': true,
                        'level': ENV == 'production' ? 'error' : 'debug',
                        'timestamp': true,
                        'label': 'DAL'
                    }
                )
            ]
    }
);

var loggerAPI = new (winston.Logger)
(
    {
        transports:
            [
                new (winston.transports.Console)
                (
                    {
                        'colorize': true,
                        'level': ENV == 'production' ? 'error' : 'debug',
                        'timestamp': true,
                        'label': 'API'
                    }
                )
            ]
    }
);

// endregion

// region module export
exports.logger = logger;
exports.loggerDAL = loggerDAL;
exports.loggerAPI = loggerAPI;

exports.config = config;

// endregion