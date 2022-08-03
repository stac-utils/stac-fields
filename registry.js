const Normalize = require('./normalize');
var Fields = require('./fields');

const Registry = {

	externalRenderer: false,

	addExtension(prefix, spec) {
		Fields.extensions[prefix] = Normalize.field(spec, Fields.extensions);
	},

	addMetadataField(field, spec) {
		Fields.metadata[field] = Normalize.field(spec, Fields.metadata);
	},

	addLinkField(field, spec) {
		Fields.links[field] = Normalize.field(spec, Fields.links);
	},

	addAssetField(field, spec) {
		Fields.assets[field] = Normalize.field(spec, Fields.assets);
	},

	addMetadataFields(specs) {
		for(var key in specs) {
			Registry.addMetadataField(key, specs[key]);
		}
	},

	getSpecification(field, type = null) {
		let spec = {};
		if (type === 'assets' && Fields.assets[field]) {
			spec = Fields.assets[field];
		}
		else if (type === 'links' && Fields.links[field]) {
			spec = Fields.links[field];
		}
		else if (Fields.metadata[field]) {
			spec = Fields.metadata[field];
		}
		return spec;
	}

};

module.exports = Registry;