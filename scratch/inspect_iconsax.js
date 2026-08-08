const fs = require('fs');
const iconsax = require('iconsax-react');
const keys = Object.keys(iconsax);
fs.writeFileSync('src/iconsax_keys.json', JSON.stringify(keys, null, 2));
console.log('Total iconsax export keys:', keys.length);
