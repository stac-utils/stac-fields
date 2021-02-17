const fs = require('fs');
const STAC = require('../formatters');
const item = require('./item.json');

let html = '<table border="1" cellspacing="0" cellpadding="4">';
for (let key in item.properties) {
	let label = STAC.label(key);
	let value = item.properties[key];
	let formatted = STAC.format(value, key, item);
	html += `<tr><td>${label}</td><td>${formatted}</td></tr>`;
}
html += '</table>';


fs.writeFileSync('demo.html', html);