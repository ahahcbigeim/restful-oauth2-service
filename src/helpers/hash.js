var crypto = require('crypto');

module.exports.checkPassword = function(password, hashedPassword, salt)
{
    return this.encryptPassword(password, salt) === hashedPassword;
};

module.exports.encryptPassword = function(password, salt)
{
    return crypto.createHmac('sha256', salt).update(password).digest('hex');
};

module.exports.generateSalt = function()
{
    return crypto.randomBytes(32).toString('base64');
};

module.exports.generateToken = function(data)
{
    var random = Math.floor(Math.random() * 100001);
    var timestamp = (new Date()).getTime();
    var sha256 = crypto.createHmac('sha256', random + 'WOO' + timestamp);
    return sha256.update(data).digest('base64');
};