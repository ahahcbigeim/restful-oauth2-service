var redisClientManager = new (require('../db/dal/clientmanager'))();

var init = require('../init');
var log = init.logger;

module.exports = function(req, res, next)
{
    log.debug('MeasureActivity: tracking number of requests made by \'%s\'.', req.clientId);

    //todo: handle error
    // Find the client in DB
    redisClientManager.incrementClientCounter(req.clientId, next);
}