const Registry = require('./registry');

Registry.importFields(require('./fields.json'));
Registry.addDependency('@musement/iso-duration', require('@musement/iso-duration'));
Registry.addDependency('content-type', require('content-type'));
Registry.addDependency('commonmark', require('commonmark'));
Registry.addDependency('multihashes', require('multihashes'));

module.exports = {
	...require('./interface'),
	Fields: Registry.exportFields(),
	Registry,
	Helper: require('./helper'),
	DataTypes: require('./datatypes'),
	Formatters: require('./formatters'),
	I18N: require('./I18N')
};