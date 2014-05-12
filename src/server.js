// region Requirements

var restify = require('restify');

var oauthserver = require('restify-oauth2');
var oauthhooks = require("./middleware/oauthhooks");

var init = require('./init');
var log = init.logger;
var config = init.config;

var checkauth = require('./middleware/checkauth');
var measureactivity = require('./middleware/measureactivity');

// Combined authentication middlewares
var athenticate = [checkauth, measureactivity];

var throttle = require('./middleware/throttle');

// endregion

// region Initialize server

var server = restify.createServer(
{
    name: 'restful-oauth2-service'
});

// Clean up sloppy paths like //get///123//
server.pre(restify.pre.sanitizePath());

// The plugin checks whether the user agent is curl.
// If it is, it sets the Connection header to "close" and removes the "Content-Length" header.
server.pre(restify.pre.userAgentConnection());

server.use(restify.authorizationParser());
server.use(restify.bodyParser({ mapParams: false }));

// Use oauth's client credentials flow
oauthserver.cc(server, { tokenEndpoint: '/token', hooks: oauthhooks });

// Define limits on bandwidth and burstiness.
// If a client has consumed all of their available rate/burst, an HTTP response code of 429 (Too Many Requests) is returned.
server.use(throttle);

// endregion

// region Routes

// Echo
server.get('/hello/:name', function send(req, res, next)
{
    res.send('hello: ' + req.params.name);
    return next();
});

// Default route (public)
server.get('/', function (req, res, next)
{
    //todo: send information on how to use this service
/*
    var routes =
    [
        'GET     /',
        'POST    /products',
        'GET     /products',
        'GET     /products/:id',
        'PUT     /products/:id',
        'DELETE  /products/:id'
    ];
    res.send(200, routes);
    next();
*/
    var response = {
        links: {
            'root':
            {
                href: '/',
                method: 'GET',
                desc: ''
            },
            'echo':
            {
                href: '/hello/:name',
                method: 'GET',
                desc: 'Public echo service.'
            },
            'oauth2-token':
            {
                href: '/token',
                method: 'POST',
                desc: 'Post client ID as username and secret as password with the following headers: grant-type=\'client_credentials\', token-type=\'bearer\', to get new authentication token. Client must be registered.'
            }
        }
    };

    res.send(response);
    return next();
});

// Resources available to authenticated clients
// curl -H "Authorization:Bearer TOKEN" http://localhost:3030/secret
server.get('/secret', athenticate, function (req, res, next)
{
    res.send('Clients with a token have access to this secret data.');
    return next();
});

/*
// Register new user
server.post('/users', athenticate, function(req, res, next)
{
    //console.log(req.body);
    //TODO: validate params
    var login = req.body.login;
    var name = req.body.name;

    userManager.addUser(login, name, function(err, document)
    {
        if (err && !document)
        {
            if (!document)
                throw err;
            //todo: tests only!!!
            return res.send(201, document);
        }

        return res.send(201, document);
    });
});

// Add new product
server.post('/products', athenticate, function(req, res, next)
{
    //console.log(req.body);
    //TODO: validate params
    var name = req.body.name;
    var category = req.body.category;

    productManager.addProduct(name, category, tags, function(err, document)
    {
        if (err)
            throw err;

        return res.send(201, document);
    });
});

// Get product list
server.get('/products', athenticate, function(req, res, next)
{
    productManager.getProducts(function(err, documents)
    {
        if (err)
            throw err;

        return res.send(200, documents);
    });
});

// Get product
server.get('/urls/:id', athenticate, function(req, res, next)
{
    var id = req.params.id;

    productManager.getProductById(id, function(err, document)
    {
        if (err)
            throw err;

        if (!document)
            return res.send(404);

        return res.send(200, document);
    });
});

// Update product
server.put('/products/:id', athenticate, function(req, res, next)
{
    res.send(204);
    return next();
});

// Delete product
server.del('/products/:id', athenticate, function(req, res, next)
{
    res.send(204);
    return next();
});
*/

// endregion

// region Events

// emitted when some handler throws an uncaughtException somewhere in the chain
server.on('uncaughtException', function(req, res, route, err)
{
    //log.error(err);
    log.error(err.stack);
    res.send(new restify.InternalError('Internal server error'));
});

// endregion

var port = config.get('port') || 3030;

// Start server (after test data created)
require('./createtestdata')(function(err)
{
    if (err)
    {
        log.error(err);
        process.exit(1);
    }

    server.listen(port, function()
    {
        log.info('%s listening at %s', server.name, server.url);
    });
});