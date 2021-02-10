var Registry = {

	createTableColumns: null,
	externalRenderer: false,

	addExtension(prefix, spec) {
		Fields.extensions[prefix] = _.normalizeField(spec, Fields.extensions);
	},

	addMetadataField(field, spec) {
		Fields.metadata[field] = _.normalizeField(spec, Fields.metadata);
	},

	addMetadataFields(specs) {
		for(var key in specs) {
			Registry.addMetadataField(key, specs[key]);
		}
	}

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
			let label = _.formatKey(key, true);
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

	formatKey(key, prefix = false) {
		if (prefix === false) {
			key = key.replace(/^\w+:/i, '');
		}
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
			if (typeof Registry.createTableColumn === 'function') {
				spec.columns = [];
			}
			for(let key in spec.items) {
				spec.items[key] = _.normalizeField(spec.items[key], fields);

				if (typeof Registry.createTableColumn === 'function') {
					let column = Registry.createTableColumn(key, spec.items[key], spec);
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

	array(arr, sort = false, unit = '') {
		return _.toList(arr, sort, v => DataTypes.format(v, unit));
	},
	
	object(obj) {
		return _.toObject(obj, v => DataTypes.format(v));
	},
	
	null(label = 'n/a') {
		return `<i>${label}</i>`;
	},
	
	number(num, unit = '') {
		if (typeof num !== 'number') {
			num = parseFloat(num);
		}
		return num.toLocaleString() + unit;
	},

	string(str, unit = '') {
		return _.e(str).replace(/(\r\n|\r|\n){2,}/g, '<br />') + unit;
	},
	
	boolean(bool) {
		return bool ? '✔️' : '❌';
	},
	
	format(value, unit = '') {
		if (typeof value === 'boolean') {
			return DataTypes.boolean(value);
		}
		else if (typeof value === 'number') {
			return DataTypes.number(value, unit);
		}
		else if (typeof value === 'string') {
			return DataTypes.string(value, unit);
		}
		else if (Array.isArray(value)) {
			return DataTypes.array(value, unit);
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
		if (typeof value !== 'string' || value.length === 0) {
			return DataTypes.null();
		}

		// We could use the spdx-license-ids and/or spdx-to-html packages previously used in STAC Browser,
		// but let's try it without additional dependency for now.
		if (value !== 'proprietary' && value !== 'various' && value.match(/^[\w\.\-]+$/i)) { // SPDX
			return _.toLink(`https://spdx.org/licenses/${value}.html`, value);
		}
		
		let licenses = Array.isArray(context.links) ? context.links.filter(link => (_.isObject(link) && typeof link.href === 'string' && link.rel === 'license')) : [];
		return _.toList(licenses, false, link => _.toLink(_.e(link.href), _.e(link.title || value)));
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
				roles = ` (<em>${roles}</em>)`;
			}
			if (typeof provider.description === 'string' && provider.description.length > 0) {
				description = Formatters.formatCommonMark(provider.description);
			}
			return `${name}${roles}${description}`;
		});
	},

	formatCommonMark(value) {
		if (typeof value !== 'string' || value.length === 0) {
			return DataTypes.null();
		}
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

	formatExtent(value, unit = '') {
		if (!Array.isArray(value) || value.length < 2 || (value[0] === null && value[1] === null)) {
			return DataTypes.formatNull();
		}
		else if (value[0] === null) {
			return `Until ${DataTypes.format(value[1], unit)}`;
		}
		else if (value[1] === null) {
			return `From ${DataTypes.format(value[0], unit)}`;
		}
		else if (value[0] === value[1]) {
			return DataTypes.format(value[0], unit);
		}
		else {
			return value.map(v => DataTypes.format(v, unit)).join(' – ');
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

	formatWKT2(value) {
		if (typeof value !== 'string') {
			return DataTypes.formatNull();
		}
		
		// This is a VERY simplistic WKT2 formatter, which may fail to render properly in some cases.
		let indent = -1;
		let formatted;
		try {
			formatted = value.replace(/([A-Z]+)\[|\]/g, (match, keyword) => {
				if (match === ']') {
					indent--;
					return match;
				}
				else {
					indent++;
					let tabs = "  ".repeat(indent);
					return `\n${tabs}${keyword}[`;
				}
			});
		} catch (e) {
			// In case the formatting did not work properly
			// (usually the number of [ and ] doesn't match)
			// just return the unformatted value
			formatted = value;
			
		}

		return `<pre>${formatted}</pre>`;
	}

};

function formatGrouped(context, prop, filter, coreKey) {
	// Group fields into extensions
	let groups = {};
	for(let field in context[prop]) {
		let parts = field.split(':', 2);
		if (parts.length === 1) {
			parts.unshift(coreKey);
		}
		let ext = parts[0];
		if (typeof filter === 'function' && !filter(field)) {
			continue;
		}

		// Add group if missing
		if (!_.isObject(groups[ext])) {
			groups[ext] = {
				extension: ext,
				label: extension(ext),
				properties: {}
			};
		}

		let value = context[prop][field];
		let spec = Fields.metadata[field] || {};

		// Fill items with missing properties
		// ToDo: This just takes the first entry into account and doesn't care about the others so some fields may be missing
		let items = null;
		if (_.isObject(spec.items) && Array.isArray(value)) {
			items = {};
			let entry = spec.mergedArrays ? value : value[0];
			let keys = Object.keys(entry);
			if (keys.length > 0) {
				Object.keys(entry[keys[0]]).forEach(key => {
					if (typeof spec.items[key] === 'undefined') {
						items[key] = {
							label: _.formatKey(key),
							explain: key
						};
					}
					else {
						items[key] = spec.items[key];
					}
				});
			}
		}

		// Format values
		let formatted;

		// Handle summaries
		if (prop === 'summaries') {
			// ToDo: Migrate to RC1, where this is minimum and maximum instead of min and max
			if (_.isObject(value) && typeof value.min !== 'undefined' && typeof value.max !== 'undefined') {
				formatted = Formatters.formatExtent([value.min, value.max], spec.unit);
			}
			else if (Array.isArray(value)) {
				formatted = [];
				if (Registry.externalRenderer && items) {
					let summaries = spec.mergedArrays ? [value] : value;
					// Go through each entry in a summary (this is besically a single value as defined in the Item spec)
					for(let i1 in summaries) {
						let summary = summaries[i1];
						formatted.push(Array.isArray(summary) ? [] : {});
						for(let i2 in summary) {
							let prop = summaries[i1][i2];
							if (Array.isArray(summary)) {
								formatted[i1].push(Array.isArray(prop) ? [] : {});
							}
							else {
								formatted[i1][i2] = Array.isArray(prop) ? [] : {};
							}
							for(let i3 in items) {
								let itemSpec = items[i3];
								formatted[i1][i2][i3] = format(prop[i3], i3, context, itemSpec);
							}
						}
					}
				}
				else {
					formatted = _.toList(value, !spec.custom && !spec.items, v => format(v, field, context, spec));
				}
			}
		}

		// Fallback to "normal" rendering if not handled by summaries yet
		if (typeof formatted === 'undefined') {
			formatted = format(value, field, context, spec);
		}

		groups[ext].properties[field] = {
			label: label(field),
			value,
			formatted,
			items,
			spec
		};
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
	if (!_.isObject(spec)) {
		spec = Fields.metadata[field] || {};
	}
	if (typeof spec.formatter === 'function') {
		return spec.formatter(value, field, spec, context) ;
	}
	else if (value === null && spec.null) {
		return DataTypes.null(spec.null);
	}
	else if (Array.isArray(value)) {
		let callback = v => format(v, field, context, spec);
		if (Registry.externalRenderer && (spec.custom || spec.items)) {
			return value.map(callback);
		}
		else {
			return _.toList(value, false, callback);
		}
	}
	else if (_.isObject(value) && _.isObject(spec.items)) {
		let callback = (v, k) => format(v, k, context, spec.items[k]);
		if (Registry.externalRenderer && (spec.custom || spec.items)) {
			let formattedValues = {};
			for(let key in value) {
				formattedValues[key] = callback(value[key]);
			}
			return formattedValues;
		}
		else {
			return _.toObject(value, callback);
		}
	}
	else {
		return DataTypes.format(value, spec.unit);
	}
}

function label(key, specs = null) {
	let spec;
	if (_.isObject(specs)) {
		spec = specs[key] || {};
	}
	else {
		spec = Fields.metadata[key] || {};
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
	Registry,
	Helper: _,
	DataTypes,
	Formatters
};