var nohm = require('nohm').Nohm;
var redisClient = require('../redisclient')();
var hash = require('../../helpers/hash');

require('../models/redis');

var init = require('../../init');
var log = init.loggerDAL;

nohm.setPrefix('restful-oauth2-service-clients');

// Override Nohm error handler
//nohm.logError = function (err) { throw err; };

var initialized = false;

function ClientManager()
{
}

function connect(action, callback)
{
	if (!initialized)
		callback(new Error('Redis client was not initialized.'));
	else
	{
		action();
	}
}

ClientManager.prototype.addClient = function(name, secret, callback)
{
	//console.log('ClientManager.addClient:', arguments);
	connect(function()
	{
		var clientModel = nohm.factory('Client');
		clientModel.load(name, function(err, result)
		{
			if (!err && result)
			{
				log.warn('ClientManager.addClient: Client with the same name is already registered.');
				callback(new Error('Client with the same name is already registered.'), result);
			}
			else
			{
				log.debug('ClientManager.addClient: Registering new client %s...', name);

				var salt = hash.generateSalt();
				var hashedSecret = hash.encryptPassword(secret, salt);

				var props =
				{
					name: name,
					salt: salt,
					secret: hashedSecret
				};

				clientModel.store(props, function(err, result)
				{
					if (err)
						log.debug('ClientManager.addClient: Save failed.');
					else
						log.debug('ClientManager.addClient: Saved successfully.');

					callback(err, result);
				});
			}
		});
	}, callback);
};

ClientManager.prototype.incrementClientCounter = function(name, callback)
{
	//console.log('ClientManager.incrementClientCounter:', arguments);
	connect(function()
	{
		var clientModel = nohm.factory('Client');
		clientModel.load(name, function(err, result)
		{
			if (err)
			{
				callback(err);
			}
			else if (!result)
			{
				log.warn('ClientManager.incrementClientCounter: the specified client could not be found.');
				callback(new Error('The specified client could not be found.'));
			}
			else
			{
				log.debug('ClientManager.incrementClientCounter: Updating client\'s activity counter...');
				clientModel.incRequestsCounter(1, callback);
			}
		});
	}, callback);
};

ClientManager.prototype.getClient = function(name, callback)
{
	//console.log('ClientManager.getClient:', arguments);
	connect(function()
	{
		var clientModel = nohm.factory('Client');
		clientModel.load(name, function(err, result)
		{
			//console.log(arguments);
			callback(err, result);
		});
	}, callback);
};

ClientManager.prototype.addClientToken = function(token, clientName, callback)
{
	//console.log('ClientManager.addClientToken:', arguments);
	connect(function()
	{
		var tokenModel = nohm.factory('Token');
		tokenModel.load(token, function(err, result)
		{
			if (!err && result)
			{
				log.warn('ClientManager.addClientToken: The specified token already exists.');
				callback(new Error('The specified token already exists.'), result);
			}
			else
			{
				log.debug('ClientManager.addClientToken: Adding new client token...');

				tokenModel.p('token', token);
				tokenModel.p('clientName', clientName);
				tokenModel.save(function(err, result)
				{
					if (err)
						log.debug('ClientManager.addClientToken: Save failed.');
					else
						log.debug('ClientManager.addClientToken: Saved successfully.');

					callback(err, result);
				});
			}
		});
	}, callback);
};

ClientManager.prototype.getClientByToken = function(token, callback)
{
	//console.log('ClientManager.getClientByToken:', arguments);
	connect(function()
	{
		var tokenModel = nohm.factory('Token');
		tokenModel.load(token, function(err, result)
		{
			//console.log(arguments);
			if (err || !result)
			{
				log.warn('ClientManager.getClientByToken: The specified token could not be found.');
				callback(new Error('The specified token could not be found.'));
			}
			else if (result.expired)
			{
				//TODO: handle expiration...
				log.warn('ClientManager.getClientByToken: The specified token is expired.');
				callback(new Error('The specified token is expired.'));
			}
			else
			{
				log.debug('ClientManager.getClientByToken: Token found. Searching for the client...');
				ClientManager.prototype.getClient(result.clientName, callback);
			}
		});
	}, callback);
};

redisClient.connect(function(err)
{
	//TODO: handle error

	if (!err)
	{
		initialized = true;

		nohm.setClient(redisClient);
	}
});

module.exports = ClientManager;