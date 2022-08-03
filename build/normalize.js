const fs = require('fs');
const Fields = require('../fields');

const file = './fields-normalized.json';
fs.writeFileSync(file, JSON.stringify(Fields, null, 4));
console.log(`Wrote ${file} to disk`);