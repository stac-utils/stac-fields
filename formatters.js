const _ = require('./helper');
const DataTypes = require('./datatypes');

const Formatters = {

	formatUrl(value, field, spec = {}, context = null, parent = null) {
		let title = _.isObject(parent) && typeof parent === 'string' ? parent.title : value;
		return _.toLink(value, title, parent.rel || "");
	},

	formatMediaType(value, field, spec = {}) {
		let short = Boolean(spec.shorten);

		let media;
		try {
			const mediaType = require('content-type');
			media = mediaType.parse(value);
		} catch (error) {
			console.warn(error);
			return short ? "" : _.e(value);
		}

		switch(media.type) {
			case 'image/tiff':
				if (media.parameters.application === "geotiff") {
					if (media.parameters.profile === "cloud-optimized") {
						return short ? 'COG' : 'Cloud-optimized GeoTIFF image';
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
			case 'text/yaml':
			case 'text/vnd.yaml':
			case 'text/x-yaml':
			case 'application/x-yaml':
				return 'YAML';
			case 'application/geo+json':
				return 'GeoJSON';
			case 'application/geopackage+vnd.sqlite3':
			case 'application/geopackage+sqlite3':
				return 'GeoPackage';
			case 'text/html':
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
			case 'application/x-netcdf':
				return 'NetCDF';
			case 'application/wmo-GRIB2':
				return 'GRIB2';
			case 'application/octet-stream':
				return short ? 'Binary' : 'Binary file';
			case 'application/vnd.laszip':
				return 'LASzip';
			case 'application/vnd.laszip+copc': // https://github.com/copcio/copcio.github.io/issues/53
				return short ? 'COPC' : 'Cloud-optimized Point Cloud (LASzip)';
			case 'application/vnd+zarr': // https://github.com/zarr-developers/zarr-specs/issues/123
				return 'Zarr';
			// ToDo: Add media types for:
			// - flatgeobuf: https://github.com/flatgeobuf/flatgeobuf/discussions/112
			// - geoparquet: https://github.com/opengeospatial/geoparquet/issues/115
			default:
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
						return _.e(value);
				}
		}
	},

	formatTimestamp(value) {
		if (typeof value === 'string') {
			try {
				return new Date(value).toLocaleString([], {
					timeZone: "UTC",
					timeZoneName: "short"
				});
			} catch (error) {}
		}
		return DataTypes.null();
	},

	formatDate(value) {
		if (typeof value === 'string') {
			try {
				return new Date(value).toLocaleString([], {
					day: 'numeric',
					month: 'numeric',
					year: 'numeric'
				});
			} catch (error) {}
		}
		return DataTypes.null();
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
		const commonmark = require('commonmark');
		let reader = new commonmark.Parser();
		let writer = new commonmark.HtmlRenderer({safe: true, smart: true});
		let html = writer.render(reader.parse(value));
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
		return _.toList(list, true);
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
		if (!Array.isArray(value) || value.length < 2 || (value[0] === null && value[1] === null)) {
			return DataTypes.null();
		}
		else if (value[0] === null) {
			return `Until ${DataTypes.format(value[1], spec.unit)}`;
		}
		else if (value[1] === null) {
			return `From ${DataTypes.format(value[0], spec.unit)}`;
		}
		else if (value[0] === value[1]) {
			return DataTypes.format(value[0], spec.unit);
		}
		else {
			return value.map(v => DataTypes.format(v, spec.unit)).join(' – ');
		}
	},

	formatHexColor(value) {
		if (typeof value !== 'string' || !value.match(/^#?[\dA-F]{3,8}$/i)) {
			return _.null();
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
		let formatter = spec.shorten ? Formatters.formatDate : Formatters.formatTimestamp;
		if (!Array.isArray(value) || value.length < 2 || (typeof value[0] !== 'string' && typeof value[1] !== 'string')) {
			return DataTypes.null();
		}
		else if (typeof value[0] !== 'string') {
			return `Until ${formatter(value[1])}`;
		}
		else if (typeof value[1] !== 'string') {
			return `${formatter(value[0])} until present`;
		}
		else if (value[0] === value[1]) {
			return Formatters.formatTimestamp(value[0]);
		}
		else {
			return value.map(date => formatter(date)).join(' - ');
		}
	},

	formatTemporalExtents(value, field, spec = {}) {
		let sortExtents = (a,b) => {
			if (a[0] === null) {
				return -1;
			}
			else {
				return a[0].localeCompare(b[0]);
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

		try {
			const multihash = require('multihashes');
			const meta = multihash.decode(_.hexToUint8(value));
			const name = _.e(meta.name);
			const hex = _.e(_.uint8ToHex(meta.digest));
			return `<div class="checksum"><input class="checksum-input" size="32" value="${hex}" readonly /><br /><span class="checksum-algo">Hashing algorithm: <strong>${name}</strong></span></div>`;
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
		"float64": "64-big float",
		"cint16": "16-bit complex integer",
		"cint32": "32-bit complex integer",
		"cfloat32": "32-bit complex float",
		"cfloat64": "64-bit complex float",
		"other": "Other"
	},

	formatFileDataType(value) {
		if (typeof value === 'string' && value in Formatters.fileDataTypes) {
			return _.abbrev(value, Formatters.fileDataTypes[value]);
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
			return rows.join('<br />');
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
				parts.push(_.abbrev(designator, 'Military Grid Reference System'));
				let [, utm, band, sq, coord] = code.match(/^(\d{2})([C-X])([A-Z]{2})(\d+)$/);
				parts.push(`UTM Zone: ${utm}`);
				parts.push(`Latitude Band: ${band}`);
				parts.push(`Square Identifier: ${sq}`);
				splitHalf(parts, coord, "Easting", "Northing");
				break;
			case 'MSIN':
				parts.push('MODIS Sinusoidal Tile Grid');
				splitHalf(parts, code, 'Horizontal', 'Vertical');
				break;
			case 'WRS1':
			case 'WRS2':
				let version = designator.substring(3,4);
				parts.push(_.abbrev('WRS-' + version, 'Worldwide Reference System ' + version));
				splitHalf(parts, code, 'Path', 'Row');
				break;
			case 'DOQ':
				parts.push('Digital Orthophoto Quadrangle');
				parts.push(`Quadrangle: ${code}`);
				break;
			case 'DOQQ':
				parts.push('Digital Orthophoto Quarter Quadrangle');
				let quad = code.substr(0, code.length - 2);
				parts.push(`Quadrangle: ${quad}`);
				let quarter = code.substr(-2);
				let a = quarter[0] === 'N' ? 'North' : 'South';
				let b = quarter[1] === 'E' ? 'East' : 'West';
				parts.push(`Quarter: ${a} ${b}`);
				break;
			case 'MXRA':
				parts.push('Maxar ARD Tile Grid');
				let [zone, quadkey] = code.split(/-(.*)/);
				if (zone.startsWith('Z')) {
					zone = zone.substring(1);
				}
				parts.push(`UTM Zone: ${zone}`);
				parts.push(`Quadkey: ${quadkey}`);
				break;
		}

		return parts.join('<br />');
	}

};

module.exports = Formatters;