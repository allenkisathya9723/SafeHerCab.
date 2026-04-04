const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'SafeHerCab_SourceCode.txt');
const dirsToScan = [
    { dir: __dirname, ext: ['.js'] },
    { dir: path.join(__dirname, 'routes'), ext: ['.js'] },
    { dir: path.join(__dirname, 'models'), ext: ['.js'] },
    { dir: path.join(__dirname, 'middleware'), ext: ['.js'] },
    { dir: path.join(__dirname, 'utils'), ext: ['.js'] },
    { dir: path.join(__dirname, 'public'), ext: ['.html'] },
    { dir: path.join(__dirname, 'public', 'css'), ext: ['.css'] },
    { dir: path.join(__dirname, 'public', 'js'), ext: ['.js'] },
];

let outContent = '';

for (const {dir, ext} of dirsToScan) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (ext.includes(path.extname(file))) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isFile()) {
                if (file === 'dump_code.js' || file === 'parse_locations.js') continue;
                outContent += `\n\n======================================================\n`;
                outContent += `File: ${path.relative(__dirname, filePath).replace(/\\/g, '/')}\n`;
                outContent += `======================================================\n\n`;
                outContent += fs.readFileSync(filePath, 'utf8');
            }
        }
    }
}

fs.writeFileSync(outPath, outContent);
console.log('Source code has been gathered into ' + outPath);
