const fs = require('fs');
const path = require('path');

const candidates = [
  { entry: 'dist/main.js', probe: 'dist/app.module.js' },
  { entry: 'dist/src/main.js', probe: 'dist/src/app.module.js' },
];

for (const candidate of candidates) {
  const entryPath = path.resolve(candidate.entry);
  const probePath = path.resolve(candidate.probe);
  if (fs.existsSync(entryPath) && fs.existsSync(probePath)) {
    require(entryPath);
    return;
  }
}

const availableEntries = candidates
  .map((candidate) => candidate.entry)
  .filter((entry) => fs.existsSync(path.resolve(entry)));

console.error(
  `Unable to start app. No valid build output found. Checked: ${candidates
    .map((candidate) => `${candidate.entry} + ${candidate.probe}`)
    .join(', ')}. Existing entry files: ${availableEntries.join(', ') || 'none'}`,
);
process.exit(1);
