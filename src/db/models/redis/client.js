var nohm = require('nohm').Nohm;

module.exports = nohm.model('Client',
{
	properties:
	{
		name:
		{
			type: "string",
			unique: true,
			validations:
			[
				'notEmpty',
				['length', { min: 4 }]
			]
		},
		secret:
		{
			type: "string",
			validations: [ 'notEmpty' ]
		},
		salt:
		{
			type: "string",
			validations: [ 'notEmpty' ]
		},
		enabled:
		{
			type: "boolean",
			defaultValue: true,
			index: true
		},
		total_requests_made:
		{
			type: "integer",
			defaultValue: 0
		}
	},
	methods:
	{
		incRequestsCounter: function (value, callback)
		{
			var requests = this.p('total_requests_made');
			this.p('total_requests_made', requests + (value || 1));
			this.save(callback);
		},
        store: function (data, callback)
        {
            var props = {};
            var fields = Object.keys(data);
            fields.forEach(function (i)
            {
                props[i] = data[i];
            });
            this.p(props);
            this.save(callback);
        }
	},
	idGenerator: function (cb)
	{
		var name = this.p('name');
		if (!name)
			throw new Error('Client name is not set!');
		cb(name);
	}
});
