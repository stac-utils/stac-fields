const fs = require('fs');
const STAC = require('../index');
const item = require('./item.json');

const properties = STAC.formatItemProperties(item);

function display(fields, h = 'h3') {
	let html = '';
	for(let g in fields) {
		let group = fields[g];
		if (group.label) {
			html += `<${h}>${group.label}</${h}>\n`;
		}
		html += '<table border="1" cellspacing="0" cellpadding="4">';
		for(let field in group.properties) {
			let prop = group.properties[field];
			html += `<tr><td title="${field}">${prop.label}</td><td>${prop.formatted}</td></tr>`;
		}
		html += '</table>\n';
	}
	return html;
}

let output = `<html><head><title>Demo</title></head><body>\n`;

output += `<h1>Item ${item.id}</h1>\n`;

output += `<h2>Properties</h2>\n`;
output += display(properties);

output += `<h2>Assets</h2>\n`;
for(let key in item.assets) {
	let asset = item.assets[key];
	let formatted = STAC.formatAsset(asset);
	output += `<h3>${key}</h3>\n`;
	output += display(formatted, 'h4');
}

output += `<h2>Links</h2>\n<ul>\n`;
for (let link of item.links) {
	let formatted = STAC.formatLink(link);
	output += `<li>${display(formatted)}</li>\n`;
}
output += `</ul>\n`;

output += `</body></html>`;

fs.writeFileSync('demo.html', output);