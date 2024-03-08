const Registry = require('./registry');
const _ = require('./helper');
const I18N = require('./I18N');
const DataTypes = require('./datatypes');
const Formatters = require('./formatters');

function formatGrouped(context, data, type, filter, coreKey) {
	// Group fields into extensions
	let groups = {};
	for(let field in data) {
		let value;
		try {
			let parts = field.split(/:(.*)/);
			if (parts.length === 1) {
				parts.unshift(coreKey);
			}
			let ext = parts[0];
			if (typeof filter === 'function' && !filter(field, [field])) {
				continue;
			}

			value = data[field];
			let spec = Registry.getSpecification(field, type);

			// Move to another extension (e.g. if no prefix is provided)
			if (spec.ext) {
				ext = spec.ext;
			}

			// Special handling for summaries that contain a list with keys (e.g. cube:dimensions, gee:schema)
			// There's usually just a single object included, so get that as value
			let isSummarizedListWithKeys = false;
			if (type === 'summaries' && spec.listWithKeys && Array.isArray(value) && value.length > 0) {
				value = value[0];
				isSummarizedListWithKeys = true;
			}

			// Fill items with missing properties
			let items = null;
			let itemOrder = [];
			if (_.isObject(spec.items)) {
				let temp = value;
				// Ignore keys for lists that are stored as object (e.g. cube:dimensions)
				if (spec.listWithKeys) {
					temp = Object.values(temp);
				}

				let itemFieldNames = [];
				if (Array.isArray(temp)) {
					itemFieldNames = _.keysFromListOfObjects(temp);
				}
				else if (_.isObject(temp)) {
					itemFieldNames = Object.keys(temp);
				}

				items = {};
				// Remove fields from list that are not available in the data
				itemOrder = spec.itemOrder.filter(fieldName => itemFieldNames.includes(fieldName));

				itemFieldNames.forEach(key => {
					if (typeof spec.items[key] === 'undefined') {
						// Add fields that are not specified in fields.json
						items[key] = {
							label: _.formatKey(key),
							explain: key
						};
						// Place non-specified fields at the end
						itemOrder.push(key);
					}
					else {
						// Clone field spec from fields.json
						items[key] = Object.assign({}, spec.items[key]);
						items[key].label = label(key, spec.items[key]);
					}
				});
			}

			// Format values
			let formatted;

			// Handle summaries
			if (type === 'summaries') {
				if (!isSummarizedListWithKeys && _.isObject(value)) {
					if (typeof value.minimum !== 'undefined' && typeof value.maximum !== 'undefined') {
						const formatSummaryValue = x => format(x, field, context, data, spec, filter, [field]);
						if (value.minimum === value.maximum) {
							formatted = formatSummaryValue(value.minimum);
						}
						else if (value.minimum === null) {
							formatted = `< ${formatSummaryValue(value.maximum)}`;
						}
						else if (value.maximum === null) {
							formatted = `> ${formatSummaryValue(value.minimum)}`;
						}
						else {
							formatted = `${formatSummaryValue(value.minimum)} – ${formatSummaryValue(value.maximum)}`;
						}
					}
					else {
						formatted = DataTypes.object(value);
					}
				}
				else if (Registry.externalRenderer && items) {
					let formatted = isSummarizedListWithKeys ? Object.assign({}, value) : value.slice(0);
					// Go through each field's summary
					for(let i in formatted) {
						let result = _.isObject(formatted[i]) ? {} : [];
						// Go through each entry in a field's summary (this is besically a single value as defined in the Item spec)
						for(let key in items) {
							result[key] = format(formatted[i][key], key, context, data, items[key]);
						}
						formatted[i] = result;
					}
				}
				else if (Array.isArray(value)) {
					formatted = _.toList(value, !spec.custom && !spec.items, v => format(v, field, context, data, spec));
				}
				else {
					console.warn(`Invalid summary value: ${value}`);
				}
			}

			// Fallback to "normal" rendering if not handled by summaries yet
			if (typeof formatted === 'undefined') {
				formatted = format(value, field, context, data, spec, filter, [field]);
			}

			// Add group if missing
			if (!_.isObject(groups[ext])) {
				groups[ext] = {
					extension: ext,
					label: extension(ext),
					properties: {}
				};
			}

			groups[ext].properties[field] = {
				label: label(field, spec),
				value,
				formatted,
				items,
				itemOrder,
				spec
			};
		} catch(error) {
			console.error(`Field '${field}' with value '${value}' resulted in an error`, error);
		}
	}
	return Object.values(groups).sort((a,b) => a.extension.localeCompare(b.extension, I18N.locales));

}

// For assets (item and collection) and item-assets (extension)
function formatAsset(asset, context, filter = null, coreKey = '') {
	return formatGrouped(context, asset, 'assets', filter, coreKey);
}

// For links
function formatLink(link, context, filter = null, coreKey = '') {
	return formatGrouped(context, link, 'links', filter, coreKey);
}

// For Providers
function formatProvider(provider, context, filter = null, coreKey = '') {
	return formatGrouped(context, provider, 'providers', filter, coreKey);
}

// For Collection summaries
function formatSummaries(collection, filter = null, coreKey = '') {
	return formatGrouped(collection, collection.summaries, 'summaries', filter, coreKey);
}

// For Collections
function formatCollection(collection, filter = null, coreKey = '') {
	return formatGrouped(collection, collection, 'collection', filter, coreKey);
}

// For Catalogs
function formatCatalog(catalog, filter = null, coreKey = '') {
	return formatGrouped(catalog, catalog, 'catalog', filter, coreKey);
}

// For item properties
function formatItemProperties(item, filter = null, coreKey = '') {
	return formatGrouped(item, item.properties, 'metadata', filter, coreKey);
}

function format(value, field, context = null, parent = null, spec = null, filter = null, path = []) {
	if (!_.isObject(spec)) {
		spec = Registry.getSpecification(field);
	}

	if (typeof spec.format === 'string') {
		let fn = Formatters[`format${spec.format}`];
		if (!fn) {
			console.warn(`Formatter '${spec.format}' not available.`);
		}
		return fn(value, field, spec, context, parent);
	}
	else if (typeof spec.formatter === 'function') {
		return spec.formatter(value, field, spec, context, parent);
	}
	else if (_.isObject(spec.mapping)) {
		let key = String(value);
		if (typeof spec.mapping[key] !== 'undefined') {
			value = spec.mapping[key];
		}
		else if (typeof spec.mapping[key.toLowerCase()] !== 'undefined') {
			value = spec.mapping[key.toLowerCase()];
		}
		else if (typeof spec.mapping[key.toUpperCase()] !== 'undefined') {
			value = spec.mapping[key.toUpperCase()];
		}
		return DataTypes.format(_.t(value), spec.unit);
	}
	else if (value === null && spec.null) {
		return DataTypes.null(spec.null);
	}
	else if (Array.isArray(value)) {
		let callback = (v, i) => format(v, field, context, parent, spec, filter, path.concat([i]));
		if (typeof filter === 'function' && path.length > 0) {
			value = value.filter((v, i) => filter(path[0], path.concat([i])));
		}
		if (Registry.externalRenderer && (spec.custom || spec.items)) {
			return value.map(callback);
		}
		else {
			return _.toList(value, false, callback);
		}
	}
	else if (_.isObject(value)) {
		let callbackSpec = k => {
			if (_.isObject(spec.items)) {
				return spec.listWithKeys ? {items: spec.items, itemOrder: spec.itemOrder} : spec.items[k];
			}
			else if (_.isObject(spec.properties)) {
				return spec.properties[k];
			}
			return {};
		};
		let callbackValue = (v, k, p) => format(v, k, context, p, callbackSpec(k), filter, path.concat([k]));
		if (Registry.externalRenderer && (spec.custom || spec.items || spec.properties)) {
			let formattedValues = {};
			for(let key in value) {
				if (typeof filter === 'function' && path.length > 0 && !filter(path[0], path.concat([k]))) {
					continue;
				}
				formattedValues[key] = callbackValue(value[key], key, value);
			}
			return formattedValues;
		}
		else {
			let callbackLabel = k => label(k, callbackSpec(k));
			let itemOrder = spec.listWithKeys ? [] : spec.itemOrder;
			return _.toObject(value, callbackValue, callbackLabel, itemOrder, filter, path);
		}
	}
	else {
		return DataTypes.format(value, spec.unit);
	}
}

function label(key, spec = null) {
	if (!_.isObject(spec)) {
		spec = Registry.getSpecification(key);
	}
	if (_.isObject(spec) && typeof spec.label === 'string') {
		if (typeof spec.explain === 'string') {
			if (spec.explain.match(/^https?:\/\//i)) {
				return _.toLink(spec.explain, _.t(spec.label), "about");
			}
			else {
				return _.abbrev(_.t(spec.label), _.t(spec.explain));
			}
		}
		else if (typeof spec.label === 'string') {
			return _.t(spec.label);
		}
	}
	return _.formatKey(key);
}

function extension(key) {
	return label(key, Registry.getExtension(key));
}

module.exports = {
	format,
	label,
	extension,
	formatCatalog,
	formatCollection,
	formatSummaries,
	formatItemProperties,
	formatAsset,
	formatLink,
	formatProvider,
	formatGrouped
};