import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json')),
);

delete packageJson.scripts;
delete packageJson.devDependencies;

packageJson.main = 'index.js';

writeFileSync(
  resolve(__dirname, '../dist/package.json'),
  JSON.stringify(packageJson, null, 2),
);
