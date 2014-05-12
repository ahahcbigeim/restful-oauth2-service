module.exports = function(req, res, next)
{
    console.log(req.method + ' ' + req.url);

    if (!req.clientId)
        res.sendUnauthenticated();
    else
        next();
}