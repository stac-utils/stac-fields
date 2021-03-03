# stac-fields

A minimal STAC library that contains a list of STAC fields with some metadata (title, unit, prefix) and helper functions.

Version: **1.0.0-beta.3**

## Usage

Add to your project with `npm install @radiantearth/stac-fields --save`

Import the utilities to format values:
`const StacFields = require('@radiantearth/stac-fields');`

Format a value:
```js
let stacItem = {
    stac_version: '1.0.0',
    id: '...',
    properties: {
        datetime: '2020-01-01T13:55:43Z',
        'radiant:public_access': true,
        ...
    },
    ...
};

// Add custom extension and field(s)
StacFields.Registry.addExtension('radiant', 'Radiant Earth');
StacFields.Registry.addMetadataField('radiant:public_access', {
    label: "Data Access",
    formatter: (value) => value ? "Public" : "Private"
});

// Option 1: Manually iterate through properties and format them
for(let field in stacItem.properties) {
    let value = stacItem.properties[field];
    let formatted = StacFields.format(value, field, stacItem);
    let label = StacFields.label(field);
    console.log(label, formatted);
}

// Option 2: Group by extension and format item properties
// The second parameter is a filter function to skip specific properties, remove to get all properties
let groups = StacFields.formatStacProperties(stacItem, key => key !== 'eo:bands');
```

This library is written for the latest version of the STAC specification (1.0.0-beta.2).
It is recommended to pass your STAC data through a migration tool like `@radiantearth/stac-migrate` (WIP) before so that it complies to the latest STAC version. Otherwise some fields may not be handled correctly.

Non-JavaScript library authors can re-use the `fields.json`. It is available at:
<https://cdn.jsdelivr.net/npm/@radiantearth/stac-fields/fields.json>

## fields.json

The following options are available in the object:

* `label`: The human-readable title for the value.
* `format`: The name of the formatter in formatters.js, but without the leading `format`.
* `formatter`: A formatter function that is compatible to the formatters defined in formatters.js. Use this if no suitable pre-defined formatter is available to be specified in `format`. See also [Custom Formatters](#custom-formatters) for more details.
* `unit`: A unit to add after the value.
* `explain`: A long form for an abbreviation that should be shown in a tooltip.
* `mapping`: A map with the keys being the original (stringified lower-case) value and the values being the values shown to users.
* `custom`: A structure that can't easily be rendered with any of the pre-defined formatters and thus needs a custom implementation (see `externalRenderer`).
* `alias`: If a field has multiple keys, declare the field to use the specification of the other field.
* `listWithKeys`: Set to `true` to allow the option `items` to specify items in an object of objects (like assets). Defaults to `false`.
* `items`: If the value is an array of objects (or an object of objects if `listWithKeys` has ben set), a table can be created with the details in this object. It has the same structure as specified here, but in additon `sortable` and `id` are allowed:
    * `sortable`: Specfiies whether the value can be sorted (`true`, e.g. in a table) or not (`false`). Defaults to `false`.
    * `id`: Specfiies whether the value is the unique primary key (`true`) or not (`false`). Defaults to `false`.
* `null`: The value that should be given instead of `null`. If a value is null but this property is not given, defaults to "n/a".
* Options related to Collection Summaries:
    * `summary`: If the fields should be added to summaries (`true`, default) or not `false`.
    * `order`: The order of the items in ascending order, e.g. for a table. If not given, the first entry is always the item with `id` set to `true`, all other items are in alphabetic order.

If only a label is available, it can be passed as string instead of an object.

Some details about the fields included in the fields.json file can be found [here](fields.md).

There is also a `fields-normalized.json`, which is a normalized version of the fields.json.
All non-Javascript users will probably prefer to use the `fields-normalized.json` as it already
has the `alias`es resolved and all fields and extensions are defined as objects for easier handling.

## formatters.js

The most important methods are:

* `format(value: any, field: string, spec: object, context: object = null, parent: object = null) => string`: Applies the right formatting depending on the data type of the a single property.
* `label(key: string, specs: object | string = 'metadata')`: Formats a label according to the rules given in `specs`. By default uses the labels from fields.json.
* `extension(key: string) => string`: Formats an extension, similar to `label`.
* `formatAssets(assets: object, context: object, filter: function = null, coreKey: string = '') => object`: Formats the assets. Also groups by extension per asset.
* `formatLinks(links: object, context: object, filter: function = null, coreKey: string = '') => object`: Formats the links. Also groups by extension per link.
* `formatSummaries(collection: object, filter: function = null, coreKey: string = '') => object`: Formats the summaries in a collection. Also groups by extension.
* `formatItemProperties(item: object, filter: function = null, coreKey: string = '') => object`: Formats the properties in an Item. Also groups by extension.

### Pre-defined formatters (`Formatters`)

* Checksum (multihashes, show original hash and hashing algorithm)
* CommonMark
* CSV (array to comma-separated values)
* DOI (generate a link for a DOI)
* EPSG (generate a link for an EPSG code)
* Extent (array with two values formatted as range)
* FileDataType (explains the data types defined in the file extension)
* FileSize (formats a number of bytes into kB, MB, ...)
* License (formats a license as link based on SPDX or the links)
* Providers (formats an array of providers)
* Software (formats the list of software as defined in the processing extension)
* TemporalExtent (array with two timestamps formatted as temporal range, see Timestamp)
* Timestamp (ISO8601 timestamp formatted according to local rules)
* WKT2 (splits a WKT2 string into nicely formatted chunks for better readability - experimental!)

### Custom formatters

Formatters are always functions that have the following signature:

`method(value : any, field : string, spec : object, context = null) => string`

- `value` is the value of the field in the STAC JSON
- `field` is the key of the field in the STAC JSON
- `spec` is the normalized object for the field from the `fields.json`.
- `context` is the full STAC JSON

The returned value is always expected to be a string.
It may contain HTML if the formatter is added to the `htmlFormats` array in `fields.json`.
If the return value is allowed to contain HTML, ALL user input must run thorugh the `e()` function (or `parseInt` for integers, for example) to escape malicious HTML tags.
This avoids XSS and similar security issues.

### `Registry`

* `externalRenderer` (boolean): Set to `true` to not render custom objects, arrays and tables with the renderers from this library. Will return formatted values individually then. Defaults to `false`.
* `addExtension(prefix : string, spec : object) => void` - Adds a additional (custom) extension that is compliant to the fields.json, can also be used to replace existing extensions
* `addMetadataField(field : string, spec : object) => void` - Adds a additional (custom) metdata field that is compliant to the fields.json, can also be used to replace existing fields
* `addLinkField(field : string, spec : object) => void` - Adds a additional (custom) metdata field only for links that is compliant to the fields.json, can also be used to replace existing fields
* `addAssetField(field : string, spec : object) => void` - Adds a additional (custom) metdata field only for assets that is compliant to the fields.json, can also be used to replace existing fields
* `addMetadataFields(specs : object) => void` - Adds additional (custom) metdata fields that are compliant to the fields.json, can also be used to replace existing fields

### Data Types (`DataTypes`)

This object has functions to format the native JSON data types as HTML strings: 
* array => `array(arr: array, sort: boolean = false) => string`
* object => `object(obj: object) => string`
* null => `null(label: string = 'n/a') => string`
* number => `number(num: number) => string`
* string => `string(str: string) => string`
* boolean => `boolean(bool: boolean) => string`

Additionally, it has a method `format(value: any) => string`, which applies the right formatting depending on the data type of the value.

All methods return strings, which may contain HTML. Input is sanitized.

### `Helpers`

* `e(str: string) => string`: Escapes the values for HTML output.
* `formatKey(key: string, prefix: boolean = false) => string`: Formats the property key nicely (e.g. the key `eo:cloud_cover` will be `Cloud Cover`). If `prefix` is set to true, the prefix will not be removed (e.g. the key `eo:cloud_cover` will then be `Eo Cloud Cover`). 
* `groupByExtensions`
* `isObject`
* `toLink(url: string, title: string) => string`: Converts a url and title to a HTML link (`<a href="$url" target="_blank">$title</a>`).
* `toList`
* `toObject`
* `normalizeFields`
* `hextoUint8`
* `uint8ToHex`
* `unit`