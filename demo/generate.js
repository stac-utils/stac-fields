const fs = require('fs');
const { Formatters } = require('../formatters');
const item = require('./item.json');

let html = '<table>';
for (let key in item.properties) {
	let label = Formatters.label(key);
	let value = item.properties[key];
	let formatted = Formatters.format(value, key, item);
	html += `<tr><td>${label}</td><td>${formatted}</td></tr>`;
}
html += '</table>';


fs.writeFileSync('demo.html', html);