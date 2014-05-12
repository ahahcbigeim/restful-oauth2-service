var nohm = require('nohm').Nohm;

module.exports = nohm.model('Token',
{
	properties:
	{
		token:
		{
			type: "string",
			unique: true,
			validations: [ 'notEmpty' ]
		},
		clientName:
		{
			type: "string",
			index: true
		},
		expired:
		{
			type: "boolean",
			defaultValue: false,
			index: true
		}
	},
	idGenerator: function (cb)
	{
		var token = this.p('token');
		if (!token)
			throw new Error('Token must be set!');
		cb(token);
	}
});
