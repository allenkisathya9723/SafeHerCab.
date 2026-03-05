const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'locations_clean.csv');
const outputFile = path.join(__dirname, 'public', 'data', 'ghmc_locations.json');

try {
    const content = fs.readFileSync(inputFile, 'utf8');
    // Basic regex to find rows matching the pattern:
    // Number, Ward, Circle, Zone, Name/Address, Latitude, Longitude, Category
    const regex = /\d+,\d+-[A-Z\s\.]+,\d+-[A-Z\s\.]+,[A-Z\s]+,.*?,[\d\.]+,[\d\.]+,[A-Z\s]+/g;

    const matches = content.match(regex);
    console.log(`Found ${matches ? matches.length : 0} potential location rows.`);

    if (!matches) {
        process.exit(1);
    }

    const locations = [];
    // Limit to 2000 locations to keep the file size manageable for the frontend
    const limit = Math.min(2000, matches.length);

    for (let i = 0; i < limit; i++) {
        const parts = matches[i].split(',');
        if (parts.length >= 8) {
            // Reconstruct name if it contains commas
            const name = parts.slice(4, parts.length - 3).join(',').replace(/^"|"$/g, '').trim();
            const lat = parseFloat(parts[parts.length - 3]);
            const lng = parseFloat(parts[parts.length - 2]);
            const type = parts[parts.length - 1].trim();

            if (name && !isNaN(lat) && !isNaN(lng)) {
                locations.push({
                    name: `${name} (${type})`,
                    lat: lat,
                    lng: lng
                });
            }
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(locations, null, 2));
    console.log(`Successfully saved ${locations.length} locations to ${outputFile}`);

} catch (error) {
    console.error('Error parsing CSV:', error);
}
