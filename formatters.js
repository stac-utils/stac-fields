const _ = require('./helper');
const DataTypes = require('./datatypes');
const I18N = require('./I18N');
const Registry = require('./registry');

const Formatters = {

	allowHtmlInCommonMark: false,

	formatUrl(value, field, spec = {}, context = null, parent = null) {
		let title = _.isObject(parent) && typeof parent === 'string' ? parent.title : value;
		return _.toLink(value, title, parent.rel || "");
	},

	formatLink(value) {
		return _.toList(value, false, value => _.toLink(value.href, value.title, value.rel));
	},

	formatMediaType(value, field, spec = {}) {
		return _.e(_.t(Formatters._formatMediaType(value, field, spec)));
	},

	_formatMediaType(value, field, spec = {}) {
		let short = Boolean(spec.shorten);

		const mediaType = Registry.getDependency('content-type');
		if (!mediaType) {
			return short ? "" : _.e(value);
		}

		let media;
		try {
			media = mediaType.parse(value);
		} catch (error) {
			console.warn(error);
			return short ? "" : _.e(value);
		}

		switch(media.type) {
			// not supported: image/vnd.stac.geotiff; cloud-optimized=true
			case 'image/tiff':
				if (media.parameters.application === "geotiff") {
					if (media.parameters.profile === "cloud-optimized") {
						return short ? 'COG' : 'Cloud-Optimized GeoTIFF image';
					}
					else {
						return short ? 'GeoTiff' : 'GeoTIFF image';
					}
				}
				else {
					return short ? 'TIFF' : 'TIFF image';
				}
			case 'image/jp2':
				return short ? 'JPEG 2000' : 'JPEG 2000 image';
			case 'image/png':
			case 'image/apng':
			case 'image/vnd.mozilla.apng':
				return short ? 'PNG' : 'PNG image';
			case 'image/gif':
				return short ? 'GIF' : 'GIF image';
			case 'image/jpeg':
			case 'image/jpg':
				return short ? 'JPEG' : 'JPEG image';
			case 'image/webp':
				return short ? 'WebP' : 'WebP image';
			case 'image/bmp':
			case 'image/x-bmp':
			case 'image/x-ms-bmp':
			case 'image/wbmp':
				return short ? 'Bitmap' : 'Bitmap image';
			case 'image/svg+xml':
				return short ? 'SVG' : 'SVG vector image';
			case 'text/csv':
				return short ? 'CSV' : 'Comma-separated values (CSV)';
			case 'text/xml':
			case 'application/xml':
				return 'XML';
			case 'text/json':
			case 'application/json':
				return 'JSON';
			case 'application/x-ndjson':
				return short ? 'NDJSON' : 'Newline Delimited JSON';
			case 'text/yaml':
			case 'text/vnd.yaml':
			case 'text/x-yaml':
			case 'application/x-yaml':
				return 'YAML';
			case 'application/geo+json':
				return 'GeoJSON';
			case 'application/gml+xml':
				return 'GML';
			case 'application/vnd.google-earth.kml+xml':
			case 'application/vnd.google-earth.kmz':
				return 'KML';
			case 'application/geopackage+vnd.sqlite3':
			case 'application/geopackage+sqlite3':
				return 'GeoPackage';
			case 'text/html':
			case 'application/html':
			case 'application/xhtml+xml':
				return short ? 'HTML' : 'HTML (Website)';
			case 'text/plain':
				return short ? 'Text' : 'Text document';
			case 'text/markdown':
				return short ? 'Markdown' : 'Markdown document';
			case 'application/pdf':
				return short ? 'PDF' : 'PDF document';
			case 'application/zip':
				return short ? 'ZIP' : 'ZIP archive';
			case 'application/gzip':
				return short ? 'GZIP' : 'GZIP archive';
			case 'application/x-hdf':
				return 'HDF';
			case 'application/netcdf':
			case 'application/x-netcdf':
				return 'NetCDF';
			case 'application/x.mrf':
				return short ? 'MRF' : 'Meta Raster Format';
			case 'application/wmo-GRIB2':
				return 'GRIB 2';
			case 'application/grib':
				return `GRIB ${media.parameters.edition || ""}`.trim();
			case 'application/bufr':
				return `BUFR ${media.parameters.edition || ""}`.trim();
			case 'application/octet-stream':
				return short ? 'Binary' : 'Binary file';
			case 'application/vnd.laszip':
				return 'LASzip';
			case 'application/vnd.laszip+copc': // https://github.com/copcio/copcio.github.io/issues/53
				return short ? 'COPC' : 'Cloud-Optimized Point Cloud (LASzip)';
			case 'application/vnd+zarr': // https://github.com/zarr-developers/zarr-specs/issues/123
				return 'Zarr';
			case 'application/x-parquet': // Inofficial
			case 'application/vnd.apache.parquet': // Official (tbc): https://github.com/opengeospatial/geoparquet/issues/115
				return 'Parquet'
			case 'application/vnd.pmtiles':
				return 'PMTiles';
			case 'application/vnd.cov+json':
				return 'CoverageJSON';
			case 'application/vnd.flatgeobuf':
				return 'FlatGeobuf'; // inofficial: https://github.com/flatgeobuf/flatgeobuf/discussions/112
			case 'application/x-filegdb':
				return short ? 'Geodatabase' : 'Esri File Geodatabase';
			case 'application/vnd.nitf':
				return short ? 'NITF' : 'National Imagery Transmission Format';
			default: {
				let [group, format] = media.type.split('/');
				format = _.formatKey(format.replace(/^(vnd|x)[.+-]/, ''));
				if (short) {
					return format;
				}
				switch(group) {
					case 'audio':
						return `${format} audio`;
					case 'image':
						return `${format} image`;
					case 'font':
						return `Font`;
					case 'model':
						return `${format} 3D model`;
					case 'video':
						return `${format} video`;
					case 'text':
					case 'application':
						return format;
					default:
						return value;
				}
			}
		}
	},

	formatTimestamp(value) {
		if (typeof value === 'string') {
			try {
				return I18N.dateTimeFormatter.format(new Date(value));
			} catch (error) {}
		}
		return DataTypes.null();
	},

	formatPercent0to1(value, field, spec = {}) {
		return DataTypes.number(value * 100, spec.unit);
	},

	formatDate(value) {
		if (typeof value === 'string') {
			try {
				return I18N.dateFormatter.format(new Date(value));
			} catch (error) {}
		}
		return DataTypes.null();
	},

	formatDuration(value) {
		if (typeof value === 'string') {
			const lib = Registry.getDependency('@musement/iso-duration');
			if (!lib) {
				return _.e(value);
			}
			const { isoDuration, en } = lib;
			isoDuration.setLocales({ en }, { fallbackLocale: 'en' });
			let formatted = isoDuration(value).humanize('en');
			if (formatted.length === 0) {
				return _.e(_.t('none'));
			}
			else {
				return _.e(formatted);
			}
		}
		return DataTypes.null();
	},

	formatLanguageCode(value) {
		if (Array.isArray(value)) {
			return _.toList(value, true, Formatters.formatLanguageCode, false);
		}
		else if (typeof value !== 'string' || value.length < 2) {
			return DataTypes.null();
		}

		const list = require('./languages.json');
		const [code, ...rest] = value.split('-');
		if (code in list) {
			const name = list[code];
			if (rest.length > 0) {
				return _.e(_.t(`${name} (${rest.join(' ')})`));
			}
			return _.e(_.t(name));
		}
		return _.e(_.t(value));
	},

	formatLicense(value, field, spec = {}, context = null) {
		if (typeof value !== 'string' || value.length === 0) {
			return DataTypes.null();
		}

		// We could use the spdx-license-ids and/or spdx-to-html packages previously used in STAC Browser,
		// but let's try it without additional dependency for now.
		if (value !== 'proprietary' && value !== 'various' && value.match(/^[\w\.\-]+$/i)) { // SPDX
			return _.toLink(`https://spdx.org/licenses/${value}.html`, value, "license");
		}
		
		let licenses = Array.isArray(context.links) ? context.links.filter(link => (_.isObject(link) && typeof link.href === 'string' && link.rel === 'license')) : [];
		if (licenses.length > 0) {
			return _.toList(licenses, false, link => _.toLink(link.href, link.title || value, "license"));
		}
		else {
			return DataTypes.string(value);
		}
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
				roles = provider.roles.map(r => DataTypes.format(r)).join(', ');
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
		const commonmark = Registry.getDependency('commonmark');
		let html;
		if (commonmark) {
			let reader = new commonmark.Parser();
			let writer = new commonmark.HtmlRenderer({safe: !Formatters.allowHtmlInCommonMark, smart: true});
			html = writer.render(reader.parse(value));
		}
		else if (Formatters.allowHtmlInCommonMark) {
			html = value;
		}
		else {
			html = _.e(value);
		}
		return `<div class="description">${html}</div>`;
	},

	formatSoftware(value) {
		if (!_.isObject(value)) {
			return DataTypes.null();
		}

		let list = [];
		for(let software in value) {
			let version = value[software];
			if ((typeof version === 'string' && version.length > 0) || typeof version === 'number') {
				list.push(`${software} (${version})`);
			}
			else {
				list.push(software);
			}
		}
		return _.toList(list, true, null, false);
	},

	formatDOI(value) {
		value = DataTypes.format(value);
		return _.toLink(`http://doi.org/${value}`, value);
	},

	formatCRS(value) {
		return _.toList(value, false, value => {
			if (typeof value === 'string') {
				let title = value
					.replace(/^https?:\/\/www\.opengis\.net\/def\/crs\//i, '') // HTTP(s) URI
					.replace(/^urn:ogc:def:crs:/i, ''); // OGC URN
				return _.toLink(value, title);
			}
			return DataTypes.format(value);
		});
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

	formatExtent(value, field, spec = {}) {
		if (!Array.isArray(value) || value.length < 2) {
			return DataTypes.null();
		}
		else if (value[0] === value[1]) {
			return DataTypes.format(value[0], spec.unit);
		}
		else if (value[0] === null) {
			return `< ${DataTypes.format(value[1], spec.unit)}`;
		}
		else if (value[1] === null) {
			return `> ${DataTypes.format(value[0], spec.unit)}`;
		}
		else {
			return value.map(v => DataTypes.format(v, spec.unit)).join(' – ');
		}
	},

	formatHexColor(value) {
		if (typeof value !== 'string' || !value.match(/^#?[\dA-F]{3,8}$/i)) {
			return DataTypes.null();
		}
		if (value.startsWith('#')) {
			value = value.substring(1);
		}
		return `<div class="color" style="background-color: #${value}"><code class="color-code">#${value}</code></div>`;
	},

	formatPROJJSON(value) {
		if (!_.isObject(value)) {
			return DataTypes.null();
		}
		if (_.isObject(value.id) && value.id.authority === 'EPSG' && typeof value.code === 'number' && value.code > 0) {
			return 'EPSG ' + Formatters.formatEPSG(value);
		}
		else if (typeof value.name === 'string') {
			return DataTypes.string(value.name);
		}
		else {
			return DataTypes.object(value);
		}
	},

	formatTemporalExtent(value, field, spec = {}) {	
		if (!Array.isArray(value) || value.length !== 2) {
			return DataTypes.null();
		}

		value = value.map(d => {
			try {
				return d ? new Date(d) : null;
			} catch(e) {
				return null;
			}
		});

		try {
			const [start, end] = value;
			if (start || end) {
				const base = spec.shorten ? I18N.dateFormatter : I18N.dateTimeFormatter;
				if (!start) {
					return _.t("Until {0}", [base.format(end)]);
				}
				else if (!end) {
					return _.t("{0} until present", [base.format(start)]);
				}
				else {
					return base.formatRange(start, end);
				}
			}
		} catch (error) {}

		return DataTypes.null();
	},

	formatTemporalExtents(value, field, spec = {}) {
		let sortExtents = (a,b) => {
			if (a[0] === null) {
				return -1;
			}
			else {
				return I18N.collator.compare(a[0], b[0]);
			}
		};
		return _.toList(value, sortExtents, v => Formatters.formatTemporalExtent(v, field, spec));
	},

	formatWKT2(value) {
		if (typeof value !== 'string') {
			return DataTypes.null();
		}
		
		// This is a VERY simplistic WKT2 formatter, which may fail to render properly in some cases.
		let indent = -1;
		let formatted;
		try {
			formatted = value.replace(/([A-Z]+)\[|\]/ig, (match, keyword) => {
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
	},

	fileSizeUnits: ['B', 'kB', 'MB', 'GB', 'TB'],

	formatFileSize(value) {
		if (typeof value !== 'number') {
			return DataTypes.format(value);
		}
		var i = value == 0 ? 0 : Math.floor( Math.log(value) / Math.log(1024) );
		return _.unit(( value / Math.pow(1024, i) ).toFixed(2) * 1, Formatters.fileSizeUnits[i]);
	},

	formatChecksum(value) {
		if (typeof value !== 'string') {
			return DataTypes.null();
		}

		const multihash = Registry.getDependency('multihashes');
		if (!multihash) {
			return _.e(value);
		}

		try {
			const meta = multihash.decode(_.hexToUint8(value));
			const name = _.e(meta.name);
			const hex = _.e(_.uint8ToHex(meta.digest));
			return `<div class="checksum"><input class="checksum-input" size="32" value="${hex}" readonly><br><span class="checksum-algo">${_.t('Hashing algorithm:')} <strong>${name}</strong></span></div>`;
		} catch (error) {
			return DataTypes.null();
		}
	},

	fileDataTypes: {
		"int8": "8-bit integer",
		"int16": "16-bit integer",
		"int32": "32-bit integer",
		"int64": "64-bit integer",
		"uint8": "unsigned 8-bit integer",
		"uint16": "unsigned 16-bit integer",
		"uint32": "unsigned 32-bit integer",
		"uint64": "unsigned 64-bit integer",
		"float16": "16-bit float",
		"float32": "32-bit float",
		"float64": "64-bit float",
		"cint16": "16-bit complex integer",
		"cint32": "32-bit complex integer",
		"cfloat32": "32-bit complex float",
		"cfloat64": "64-bit complex float"
	},

	formatFileDataType(value) {
		if (value === "other") {
			return _.t("non-standard");
		}
		else if (typeof value === 'string' && value in Formatters.fileDataTypes) {
			return _.abbrev(_.t(value), _.t(Formatters.fileDataTypes[value]));
		}

		return DataTypes.null();
	},

	formatTransform(value) {
		if (Array.isArray(value) && value.length % 3 === 0) {
			let rows = [];
			for (let i = 0; i < value.length; i = i+3) {
				let chunk = value.slice(i, i + 3);
				rows.push(`[${Formatters.formatCSV(chunk)}]`);
			}
			return rows.join('<br>');
		}
		else {
			return Formatters.formatCSV(value);
		}
	},

	formatShape(value, field, spec = {}) {
		if (Array.isArray(value)) {
			return value.map(x => DataTypes.format(x, spec.unit)).join(' × ');
		}
		else {
			return DataTypes.format(value, spec.unit);
		}
	},

	formatCSV(value) {
		if (Array.isArray(value)) {
			let numeric = value.find(v => typeof v === 'number') !== undefined;
			// If there's potentially a comma in the values (decimal or thousand separators in numbers), use semicolon instead of comma.
			return value.map(DataTypes.format).join(numeric ? '; ' : ', ');
		}
		else {
			return DataTypes.format(value);
		}
	},

	formatImage(value, field) { // from url or link
		let title = "";
		let src = null;
		if (_.isObject(value)) {
			src = value.href;
			title = value.title || "";
		}
		else if (typeof value === 'string') {
			src = value;
		}
		else {
			return DataTypes.format(src);
		}

		return `<img src="${_.e(src)}" title="${_.e(title)}" class="${_.e(field.replace(':', '_'))}">`;
	},

	formatPhone(value) {
		return _.toLink(`tel:${value}`, value);
	},

	formatEmail(value) {
		return _.toLink(`mailto:${value}`, value);
	},

	formatConcepts(value) {
		return _.toList(value, false, concept => {
			if (!_.isObject(concept)) {
				return DataTypes.format(concept);
			}

			let html = "";
			if (concept.title) {
				let title = concept.title;
				if (concept.url) {
					title = _.toLink(concept.url, concept.title);
				}
				html += `<strong>${title}</strong> (<code>${_.e(concept.id)}</code>)`;
			}
			else {
				let title = concept.id;
				if (concept.url) {
					title = _.toLink(concept.url, concept.id);
				}
				html += `<strong><code>${title}</code></strong>`;
			}
			if (concept.description) {
				html += `<br><small>${_.e(concept.description)}</small>`;
			}
			return html;
		});
	},

	formatAddress(value) { // array or object
		return _.toList(value, false, address => {
			if (!_.isObject(address)) {
				return DataTypes.format(address);
			}

			let lines = Array.isArray(address.deliveryPoint) ? address.deliveryPoint.slice(0) : [];

			if (address.postalCode && address.city) {
				// Try to create a compact address
				let line = `${address.postalCode} ${address.city}`;
				if (address.administrativeArea) {
					line += ` (${address.administrativeArea})`;
				}
				if (typeof address.country === 'string' && address.country.length > 0) {
					if (address.country.length === 2 && address.country.toUpperCase() === address.country) { // is ISO code
						line = address.country + '-' + line;
						lines.push(line);
					}
					else {
						lines.push(line);
						lines.push(address.country.toUpperCase());
					}
				}
			}
			else {
				// Long version of the address
				if (address.city) {
					lines.push(address.city);
				}
				if (address.administrativeArea) {
					lines.push(address.administrativeArea);
				}
				if (address.postalCode) {
					lines.push(address.postalCode);
				}
				if (typeof address.country === 'string' && address.country.length > 0) {
					lines.push(address.country.toUpperCase());
				}
			}
			return DataTypes.string(lines.join("\n\n"));
		});
	},

	formatGridCode(value) {
		if (typeof value !== 'string') {
			return DataTypes.format(value);
		}

		let splitHalf = function(parts, value, labelA, labelB) {
			let len = value.length;
			if ((len % 2) === 1) {
				parts.push(`Code: ${value}`);
			}
			else {
				let mid = len/2;
				let a = value.substring(0, mid);
				parts.push(`${labelA}: ${a}`);
				let b = value.substring(mid, len);
				parts.push(`${labelB}: ${b}`);
			}
		};

		let [designator, code] = value.split(/-(.*)/);
		let parts = [];
		switch(designator) {
			case 'MGRS': 
				parts.push(_.abbrev(_.t(designator), _.t('Military Grid Reference System')));
				let [, utm, band, sq, coord] = code.match(/^(\d{2})([C-X])([A-Z]{2})(\d*)$/);
				parts.push(`${_.t("UTM Zone")}: ${utm}`);
				parts.push(`${_.t("Latitude Band")}: ${band}`);
				parts.push(`${_.t("Square Identifier")}: ${sq}`);
				if (coord) {
					splitHalf(parts, coord, _.t("Easting"), _.t("Northing"));
				}
				break;
			case 'MSIN':
				parts.push(_.t('MODIS Sinusoidal Tile Grid'));
				splitHalf(parts, code, _.t('Horizontal'), _.t('Vertical'));
				break;
			case 'WRS1':
			case 'WRS2':
				let version = designator.substring(3,4);
				parts.push(_.abbrev(_.t('WRS-' + version), _.t('Worldwide Reference System ' + version)));
				splitHalf(parts, code, _.t('Path'), _.t('Row'));
				break;
			case 'DOQ':
				parts.push(_abbrev(_.t(designator), _.t('Digital Orthophoto Quadrangle')));
				parts.push(`${_.t("Quadrangle")}: ${code}`);
				break;
			case 'DOQQ':
				parts.push(_abbrev(_.t(designator), _.t('Digital Orthophoto Quarter Quadrangle')));
				let quad = code.substr(0, code.length - 2);
				parts.push(`${_.t("Quadrangle")}: ${quad}`);
				let quarter = code.substr(-2);
				let a = quarter[0] === 'N' ? _.t('North') : _.t('South');
				let b = quarter[1] === 'E' ? _.t('East') : _.t('West');
				parts.push(`${_.t("Quarter")}: ${a} ${b}`);
				break;
			case 'MXRA':
				parts.push(_.t('Maxar ARD Tile Grid'));
				let [zone, quadkey] = code.split(/-(.*)/);
				if (zone.startsWith('Z')) {
					zone = zone.substring(1);
				}
				parts.push(`${_.t("UTM Zone")}: ${zone}`);
				parts.push(`${_.t("Quadkey")}: ${quadkey}`);
				break;
			case 'EASE':
				let [dggs, components] = code.split('-');
				if (dggs === 'DGGS') {
					parts.push(_.t('EASE-DGGS'));
					let [level, rowcol, ...fractions] = components.split('.');
					parts.push(`${_.t("Level")}: ${level}`);
					if (rowcol.length === 6) {
						parts.push(`${_.t("Level 0 row cell")}: ${rowcol.substring(0,3)}`);
						parts.push(`${_.t("Level 0 column cell")}: ${rowcol.substring(3,6)}`);
						for(let i in fractions) {
							let value = fractions[i];
							if (value.length === 2) {
								parts.push(`${_.t("Fraction of level {i} row cell", {i})}: ${value[0]}`);
								parts.push(`${_.t("Fraction of level {i} column cell", {i})}: ${value[1]}`);
							}
						}
					}
					break;
				}
			case 'CDEM':
				let [, n, e] = code.match(/^([A-Z]\d+)([A-Z]\d+)$/);
				parts.push(_.t("Copernicus Digital Elevation Model Grid"));
				parts.push(`${_.t("Easting")}: ${e}`);
				parts.push(`${_.t("Northing")}: ${n}`);
			default:
				parts.push(value);
		}

		return parts.join('<br>');
	}

};

module.exports = Formatters;