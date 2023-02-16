const fs = require('fs');
const Registry = require('../registry');
Registry.importFields(require('../fields.json'));

const file = './fields-normalized.json';
fs.writeFileSync(file, JSON.stringify(Registry.exportFields(), null, 4));
console.log(`Wrote ${file} to disk`);