const Normalize = require('./normalize');

const Registry = {

	externalRenderer: false,
	dependencies: {},
	fields: {
		assets: {},
		extensions: {},
		links: {},
		metadata: {}
	},

	exportFields() {
		return this.fields;
	},

	importFields(fields) {
		fields = Normalize.fields(fields);
		for(let key in this.fields) {
			Object.assign(this.fields[key], fields[key]);
		}
	},

	getDependency(name) {
		if (!this.dependencies[name]) {
			console.warn(`Dependency '${name}' not registered.`);
		}
		return this.dependencies[name];
	},

	addDependency(name, library) {
		this.dependencies[name] = library;
	},

	addExtension(prefix, spec) {
		this.fields.extensions[prefix] = Normalize.field(spec, this.fields.extensions);
	},

	addMetadataField(field, spec) {
		this.fields.metadata[field] = Normalize.field(spec, this.fields.metadata);
	},

	addLinkField(field, spec) {
		this.fields.links[field] = Normalize.field(spec, this.fields.links);
	},

	addAssetField(field, spec) {
		this.fields.assets[field] = Normalize.field(spec, this.fields.assets);
	},

	addMetadataFields(specs) {
		for(var key in specs) {
			Registry.addMetadataField(key, specs[key]);
		}
	},

	getExtension(name) {
		if (this.fields.extensions[name]) {
			return this.fields.extensions[name];
		}
		else {
			return {};
		}
	},

	getSpecification(field, type = null) {
		let spec = {};
		if (type === 'assets' && this.fields.assets[field]) {
			spec = this.fields.assets[field];
		}
		else if (type === 'links' && this.fields.links[field]) {
			spec = this.fields.links[field];
		}
		else if (this.fields.metadata[field]) {
			spec = this.fields.metadata[field];
		}
		return spec;
	}

};

module.exports = Registry;