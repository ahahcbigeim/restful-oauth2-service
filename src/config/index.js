/**
 * Configuration module (initialized on start)
 */
var nconf = require('nconf');
var path = require('path');
var fs = require('fs');

var environment = process.env.NODE_ENV;
if (!environment || environment.length == 0)
{
    environment = "local";
}
console.log('Environment: ' + environment);

var configFileName = environment + '.json';
var configFilePath = path.join(__dirname, configFileName);

if (fs.existsSync(configFilePath))
{
    nconf.argv()
        .env()
        .file({ file: configFilePath });
}
else
{
    console.log('Configuration file \'' + configFilePath + '\' not found.');
    process.exit(1);
}


module.exports = nconf;