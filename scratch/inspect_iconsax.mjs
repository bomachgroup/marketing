import fs from 'fs';
import * as Iconsax from 'iconsax-react';

const keys = Object.keys(Iconsax);
fs.writeFileSync('src/iconsax_keys.json', JSON.stringify(keys, null, 2));
console.log('Total iconsax export keys:', keys.length);
