# stac-fields

A minimal STAC library that contains a list of STAC fields with some metadata (title, unit, prefix) and helper functions..

## Usage

Add to your project with `npm install @radiantearth/stac-fields --save`

Import the utilities to format values:
`const StacFields = require('@radiantearth/stac-fields');`

Format a value:
```js
let stacItem = {
    id: '...',
    properties: {
        ...
    },
    ...
};

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

Non-JavaScript library authors can re-use the `fields.json`. It is available at:
* TODO: Add JsDelivr link

## fields.json

The following options are available in the object:

* `label`: The human-readable title for the value.
* `format`: The name of the formatter in formatters.js, but without the leading `format`.
* `unit`: A unit to add after the value.
* `explain`: A long form for an abbreviation that should be shown in a tooltip.
* `complex`: A complex structure like a table that should be rendered separately, e.g. in a separate windows, tab or modal.
* `alias`: If a field has multiple keys, declare the field to use the specification of the other field.
* `items`: If the value is an array of objects, a table can be created with the details in this object. It has the same structure as specified here, but in additon `sortable` and `id` are allowed:
    * `sortable`: Specfiies whether the value can be sorted (`true`, e.g. in a table) or not (`false`). Defaults to `false`.
    * `id`: Specfiies whether the value is the unique primary key (`true`) or not (`false`). Defaults to `false`.
* `null`: The value that should be given instead of `null`. If a value is null but this property is not given, defaults to "N/A".

If only a label is available, it can be passed as string instead of an object.

## formatters.js

The most important methods are:

* `format(value, field, spec, context = null)`: Applies the right formatting depending on the data type of the a single property.
* label
* extension
* formatSummaries
* formatItemProperties

### Pre-defined formatters (`Formatters`)

* CommonMark
* DOI
* EPSG
* Extent (array with two values)
* License
* Providers
* Software
* TemporalExtent (array with two timestamps)
* Timestamp (ISO8601 timestamp)
* Summary

### Custom formatters

Formatters are always functions that have the following signature:

`method(value : any, field : string, spec : object, context = null)`

- `value` is the value of the field in the STAC JSON
- `field` is the key of the field in the STAC JSON
- `spec` is the normalized object for the field from the `fields.json`.
- `context` is the full STAC JSON

The returned value is always expected to be a string.
It may contain HTML if the formatter is added to the `htmlFormats` array in `fields.json`.
If the return value is allowed to contain HTML, ALL user input must run thorugh the `e()` function (or `parseInt` for integers, for example) to escape malicious HTML tags.
This avoids XSS and similar security issues.

### `Config`

* `createTableColumn` (function\|null): Specify a function with the signature `function(field, columnSpec, parentSpec) => object` to convert a field containing `items` to a table column for your favorite table rendering component. Will be made available as a property `columns` on the same level as `items`.
* `externalRenderer` (boolean): Set to `true` to not render objects or arrays with the renderers from this library. Values will be untouched then. Defaults to `false`.

### Data Types (`DataTypes`)

This object has functions to format the native JSON data types: 
* array => `array(arr, sort = false)`
* object => `object(obj)`
* null => `null(label = 'N/A')`
* number => `number(num)`
* string => `string(str)`
* boolean => `boolean(bool)`

Additionally, it has a method `format(value)`, which applies the right formatting depending on the data type of the value.

All methods return strings, which may contain HTML. Input is sanitized.

### `Helpers`

* e
* formatKey
* groupByExtensions
* isObject
* toLink
* toList
* toObject
* normalizeFields