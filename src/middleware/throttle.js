// region Requirements

var _ = require('underscore');
var restify = require('restify');

var init = require('../init');
var log = init.logger;

var client = require('../db/redisclient')();

// endregion

/*
 * Options to create the throttle with:
 * - {Number} rate:   The actions per time window to replenish. REQUIRED
 * - {Number} burst:  The number allowed to burst to in a time window. Default = rate
 * - {Number} window: The time window in milliseconds to measure actions in. Default = 1000
 * - {Number} expiry: Number of seconds to expire untouched entries (optional)
 * - {String} prefix: A string to prefix all token entries with (default 'redisThrottle')
 * - {TokensTable} tokensTable: A replacement token table to use. Must provide get/set.
 * - {Object} overrides: A set of overrides for certain tokens.
 *                      Can specify alternate rate, burst, or window.
 *                      Does not inherit, so defaults apply.
 */
// Merge with the required options (defaults)
var options = _.extend(init.config.get('throttle') || {},
{
    rate: 1,
    burst: 1,
    username: true, // Do throttling on username (for restify throttling)
    expiry: 0, // Never expire
    prefix: 'api-request-throttling-tokens'
});

// Make separate object with options for default throttling (the original one will be modified)
var options2 = _.clone(options);

var redisThrottle = require('tokenthrottle-redis')(options, client);
var restifyThrottle = restify.throttle(options2);

module.exports = function(req, res, next)
{
    // Limit requests made by client (if client isn't authenticated, use IP)
    var key = req.clientId || req.connection.remoteAddress;

    if (!key)
    {
        log.warn('Throttle: unable to throttle this request - both clientId and remoteAddress are empty.');
        next();
    }
    else
    {
        log.debug('Throttle: measuring requests rate for \'' + key + '\'.');

        if (client.connected)
        {
            // When connected to Redis, will use throttling with tokens stored in Redis
            redisThrottle.rateLimit(key, function (err, limited)
            {
                if (err)
                {
                    next(err);
                }
                else if (limited)
                {
                    log.warn('Throttle: \'' + key + '\' has reached the limit.');
                    next(new restify.TooManyRequestsError('You have reached the requests rate. Try again later.'));
                }
                else
                {
                    next();
                }
            });
        }
        else
        {
            // Default restify implementation used when could not connect to Redis

            // Set key as username in the request
            var username = req.username;
            req.username = key;

            try
            {
                restifyThrottle(req, res, next);
            }
            finally
            {
                // Revert username in the request back to its orig. value
                req.username = username;
            }
        }
    }
};