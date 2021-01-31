var Config = {

	createTableColumns: null,
	externalRenderer: false

};

var _ = {

	e(str) {
		if (typeof str !== 'string') {
			str = String(str);
		}
		return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, '&apos;');
	},

	toList(arr, sort = false, formatter = null) {
		let list = arr;
		let tag = 'ol';
		if (sort) {
			list = list.slice(0).sort();
			tag = 'ul';
		}
		if (typeof formatter === 'function') {
			list = list.map(formatter);
		}
		if (list.length === 0) {
			return formatter(null);
		}
		else if (list.length === 1) {
			return list[0];
		}
		else {
			return `<${tag}><li>${list.join("</li><li>")}</li></${tag}>`;
		}
	},

	toLink(url, title) {
		return `<a href="${url}" target="_blank">${title}</a>`;
	},

	toObject(obj, formatter = null) {
		let html = '<dl>';
		for(let key in obj) {
			// ToDo: also convert CamelCase? but not abbreviations like "USA".
			let label = _.formatKey(key);
			let value = obj[key];
			if (typeof formatter === 'function') {
				value = formatter(value, key);
			}
			// TODO: Format label (also in arrays)
			html += `<dt>${label}</dt><dd>${value}</dd>`;
		}
		html += `</dl>`;
		return html;
	},

	isObject(obj) {
		return (typeof obj === 'object' && obj === Object(obj) && !Array.isArray(obj));
	},

	formatKey(key) {
		return _.e(key).split(/[:_\-\s]/g).map(part => part.substr(0, 1).toUpperCase() + part.substr(1)).join(' ');
	},

	normalizeFields(fields) {
		for(let key in fields.extensions) {
			fields.extensions[key] = _.normalizeField(fields.extensions[key], fields.extensions);
		}
		for(let key in fields.metadata) {
			fields.metadata[key] = _.normalizeField(fields.metadata[key], fields.metadata);
		}
		return fields;
	},

	normalizeField(spec, fields = {}) {
		// If just a string label is given, make a normal object with a label from it
		if (typeof spec === 'string') {
			return {
				label: spec
			};
		}
		// Resolve alias
		if (typeof spec.alias === 'string') {
			// As we don't know whether the alias has been resolved so far, resolve it here, too.
			return Object.assign(spec, _.normalizeField(fields[spec.alias], fields));
		}

		// Add formatting callback as `formatter`
		if (typeof spec.format === 'string') {
			spec.formatter = Formatters[`format${spec.format}`];
		}

		// Normalize items
		if (_.isObject(spec.items)) {
			if (typeof Config.createTableColumn === 'function') {
				spec.columns = [];
			}
			for(let key in spec.items) {
				spec.items[key] = _.normalizeField(spec.items[key], fields);

				if (typeof Config.createTableColumn === 'function') {
					let column = Config.createTableColumn(key, spec.items[key], spec);
					if (spec.items[key].id) {
						spec.columns.unshift(column);
					}
					else {
						spec.columns.push(column);
					}
				}
			}
		}

		return spec;
	}

};

var DataTypes = {

	array(arr, sort = false) {
		return _.toList(arr, sort, DataTypes.format);
	},
	
	object(obj) {
		return _.toObject(obj, DataTypes.format);
	},
	
	null(label = 'N/A') {
		return `<i>${label}</i>`;
	},
	
	number(num) {
		if (typeof num !== 'number') {
			num = parseFloat(num);
		}
		return num.toLocaleString();
	},

	string(str) {
		return _.e(str).replace(/(\r\n|\r|\n){2,}/g, '<br />');
	},
	
	boolean(bool) {
		return bool ? '✔️' : '❌';
	},
	
	format(value) {
		if (typeof value === 'boolean') {
			return DataTypes.boolean(value);
		}
		else if (typeof value === 'number') {
			return DataTypes.number(value);
		}
		else if (typeof value === 'string') {
			return DataTypes.string(value);
		}
		else if (Array.isArray(value)) {
			return DataTypes.array(value);
		}
		else if (_.isObject(value)) {
			return DataTypes.object(value);
		}
		else {
			return DataTypes.null();
		}
	}

};

var Formatters = {

	formatTimestamp(value) {
		try {
			return new Date(value).toLocaleString([], {
				timeZone: "UTC",
				timeZoneName: "short"
			});
		} catch (error) {
			return DataTypes.null();
		}
	},

	formatLicense(value, field, spec, context = null) {
		if (typeof value !== 'string') {
			return DataTypes.null();
		}

		// We could use the spdx-license-ids and/or spdx-to-html packages previously used in STAC Browser,
		// but let's try it without additional dependency for now.
		if (value !== 'proprietary' && value !== 'various' && value.match(/^[\w\.\-]+$/i)) { // SPDX
			return _.toLink(`https://spdx.org/licenses/${value}.html`, value);
		}
		
		let licenses = Array.isArray(context.links) ? context.links.filter(link => (_.isObject(link) && typeof link.href === 'string' && link.rel === 'license')) : [];
		return _.toList(licenses, false, link => _.toLink(_.e(link.href), _.e(link.title || link.href)));
	},

	formatProviders(value) {
		return _.toList(value, false, provider => {
			let name = provider.name;
			let roles = '';
			let description = '';
			if (typeof provider.url === 'string' && provider.url.length > 0) {
				name = _.toLink(provider.url, name);
			}
			if (Array.isArray(provider.roles) && provider.roles.length > 0) {
				roles = provider.roles.map(r => _.e(r)).join(', ');
				roles = `<br /><small>${roles}</small>`;
			}
			if (typeof provider.description === 'string' && provider.description.length > 0) {
				description = Formatters.formatCommonMark(provider.description);
			}
			return `${name}${roles}${description}`;
		});
	},

	formatCommonMark(value) {
		const commonmark = require('commonmark');
		let reader = new commonmark.Parser();
		let writer = new commonmark.HtmlRenderer({safe: true, smart: true});
		let html = writer.render(reader.parse(value));
		return `<div class="descrption">${html}</div>`;
	},

	formatSoftware(value) {
		if (!_.isObject(value)) {
			return DataTypes.null();
		}

		let list = [];
		for(let software in value) {
			let version = value[software];
			if ((typeof version === 'string' && version.length > 0) || typeof version === 'number') {
				list.push(`${software} ${version}`);
			}
			else {
				list.push(software);
			}
		}
		return _.toList(list, true, e);
	},

	formatDOI(value) {
		value = _.e(value);
		return _.toLink(`http://doi.org/${value}`, value);
	},

	formatEPSG(value) {
		// Remove leading 'epsg:' which people sometimes prepend
		if (typeof value === 'string') {
			value = value.replace(/^epsg:/i, '');
		}
		value = parseInt(value, 10);
		if (value > 0) {
			return _.toLink(`http://epsg.io/${value}`, value);
		}
		else {
			return DataTypes.null();
		}
	},

	formatExtent(value) {
		if (!Array.isArray(value) || value.length < 2 || (value[0] === null && value[1] === null)) {
			return DataTypes.formatNull();
		}
		else if (value[0] !== null) {
			return `Until ${DataTypes.format(value[1])}`;
		}
		else if (value[1] !== null) {
			return `From ${DataTypes.format(value[0])}`;
		}
		else if (value[0] === value[1]) {
			return DataTypes.format(value[0]);
		}
		else {
			return value.map(v => DataTypes.format(v)).join(' - ');
		}
	},

	// Helper, not used at the moment
	formatTemporalExtent(value) {
		if (!Array.isArray(value) || value.length < 2 || (typeof value[0] !== 'string' && typeof value[1] !== 'string')) {
			return DataTypes.formatNull();
		}
		else if (typeof value[0] !== 'string') {
			return `Until ${Formatters.formatTimestamp(value[1])}`;
		}
		else if (typeof value[1] !== 'string') {
			return `${Formatters.formatTimestamp(value[0])} until present`;
		}
		else if (value[0] === value[1]) {
			return Formatters.formatTimestamp(value[0]);
		}
		else {
			return value.map(date => Formatters.formatTimestamp(date)).join(' - ');
		}
	},

	formatSummary(value, field, spec, context = null) {
		if (_.isObject(value) && typeof value.min !== 'undefined' && typeof value.max !== 'undefined') {
			return Formatters.formatExtent([value.min, value.max]);
		}
		else if (Array.isArray(value)) {
			return _.toList(value, !spec.complex, v => format(v, field, spec, context));
		}
	}

};

function formatGrouped(obj, prop, filter, coreKey) {
	let groups = {};
	for(let key in obj[prop]) {
		let parts = key.split(':', 2);
		if (parts.length === 1) {
			parts.unshift(coreKey);
		}
		let ext = parts[0];
		if (typeof filter === 'function' && !filter(key)) {
			continue;
		}
		if (!_.isObject(groups[ext])) {
			groups[ext] = {
				extension: ext,
				label: extension(ext),
				properties: {}
			};
		}
		groups[ext].properties[key] = {
			label: label(key),
			value: obj[prop][key],
			formatted: format(obj[prop][key], key, obj)
		}
	}
	return Object.values(groups).sort((a,b) => a.extension.localeCompare(b.extension));

}

function formatSummaries(collection, filter = null, coreKey = '') {
	return formatGrouped(collection, 'summaries', filter, coreKey);
}

function formatItemProperties(item, filter = null, coreKey = '') {
	return formatGrouped(item, 'properties', filter, coreKey);
}

function format(value, field, context = null, spec = null) {
	if (spec === null) {
		spec = Fields.metadata[field] || {};
	}
	let unit = typeof spec.unit === 'string' ? ` ${spec.unit}` : '';
	if (typeof spec.formatter === 'function') {
		return spec.formatter(value, field, spec, context) + unit;
	}
	else if (value === null && spec.null) {
		return DataTypes.null(spec.null);
	}
	else if (Array.isArray(value) && _.isObject(spec.items)) {
		if (Config.externalRenderer) {
			return value;
		}
		else {
			return _.toList(value, false, v => format(v, field, context, spec));
		}
	}
	else if (_.isObject(value) && _.isObject(spec.items)) {
		if (Config.externalRenderer) {
			return value;
		}
		else {
			return _.toObject(value, (v, k) => format(v, k, context, spec.items[k]));
		}
	}
	else {
		return DataTypes.format(value) + unit;
	}
}

function label(key, fields = null) {
	let spec;
	if (fields === null) {
		spec = Fields.metadata[key];
	}
	else {
		// TODO: Check whether this is actually useful
		spec = fields[key];
	}
	if (_.isObject(spec) && typeof spec.label === 'string') {
		if (typeof spec.explain === 'string') {
			return `<abbr title="${_.e(spec.explain)}">${spec.label}</abbr>`;
		}
		else if (typeof spec.label === 'string') {
			return spec.label;
		}
	}
	return _.formatKey(key);
}

function extension(key) {
	return label(key, Fields.extensions);
}

var Fields = _.normalizeFields(require('./fields.json'));

module.exports = {
	format,
	label,
	extension,
	formatSummaries,
	formatItemProperties,
	Fields,
	Config,
	Helper: _,
	DataTypes,
	Formatters
};