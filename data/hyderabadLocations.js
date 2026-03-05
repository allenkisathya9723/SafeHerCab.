// SafeHerCab – Hyderabad Locations Database (JS version for Express backend)
// Source: data/hyderabadLocations.ts (200+ places across 16 categories)

const fs = require('fs');
const path = require('path');

let ghmcLocations = [];
try {
    const dataPath = path.join(__dirname, '../public/data/ghmc_locations.json');
    if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        ghmcLocations = JSON.parse(raw).map(item => ({
            name: item.name,
            lat: item.lat,
            lon: item.lng, // map lng to lon for consistency with the existing data
            category: 'Landmark' // Default category for GHMC spots
        }));
    }
} catch (e) {
    console.error('Failed to load GHMC locations JSON:', e.message);
}

const hyderabadLocations = [
    // Famous Places & Landmarks
    { name: "Charminar", lat: 17.3616, lon: 78.4747, category: "Landmark" },
    { name: "Golconda Fort", lat: 17.3833, lon: 78.4011, category: "Landmark" },
    { name: "Hussain Sagar Lake", lat: 17.4239, lon: 78.4738, category: "Landmark" },
    { name: "Birla Mandir", lat: 17.4063, lon: 78.4691, category: "Temple" },
    { name: "Salar Jung Museum", lat: 17.3713, lon: 78.4804, category: "Landmark" },
    { name: "Ramoji Film City", lat: 17.2543, lon: 78.6808, category: "Landmark" },
    { name: "Snow World", lat: 17.4234, lon: 78.4739, category: "Landmark" },
    { name: "Lumbini Park", lat: 17.4100, lon: 78.4734, category: "Landmark" },
    { name: "NTR Gardens", lat: 17.4087, lon: 78.4725, category: "Landmark" },
    { name: "Shilparamam", lat: 17.4525, lon: 78.3816, category: "Landmark" },
    { name: "Chowmahalla Palace", lat: 17.3576, lon: 78.4718, category: "Landmark" },
    { name: "Qutb Shahi Tombs", lat: 17.3945, lon: 78.3953, category: "Landmark" },
    { name: "Nehru Zoological Park", lat: 17.3500, lon: 78.4513, category: "Landmark" },
    // Temples
    { name: "Chilkur Balaji Temple", lat: 17.3172, lon: 78.3383, category: "Temple" },
    { name: "Jagannath Temple, Hyderabad", lat: 17.3958, lon: 78.3882, category: "Temple" },
    { name: "Peddamma Temple, Jubilee Hills", lat: 17.4318, lon: 78.4115, category: "Temple" },
    { name: "Karmanghat Hanuman Temple", lat: 17.3500, lon: 78.5258, category: "Temple" },
    { name: "Mecca Masjid", lat: 17.3604, lon: 78.4736, category: "Temple" },
    { name: "Sri Rama Temple, Secunderabad", lat: 17.4359, lon: 78.4983, category: "Temple" },
    { name: "ISKCON Temple, Abids", lat: 17.3932, lon: 78.4738, category: "Temple" },
    { name: "Keesaragutta Temple", lat: 17.4203, lon: 78.6281, category: "Temple" },
    // Engineering Colleges — Ghatkesar & Nearby
    { name: "Nalla Narasimha Reddy Engineering College (NNRG), Ghatkesar", lat: 17.4500, lon: 78.6200, category: "Engineering College" },
    { name: "CVR College of Engineering, Ghatkesar", lat: 17.5024, lon: 78.6464, category: "Engineering College" },
    { name: "Anurag University, Ghatkesar", lat: 17.4380, lon: 78.6350, category: "Engineering College" },
    { name: "Geethanjali College of Engineering & Technology, Keesara", lat: 17.4700, lon: 78.6100, category: "Engineering College" },
    { name: "Sreenidhi Institute of Science & Tech (SNIST), Ghatkesar", lat: 17.3734, lon: 78.5800, category: "Engineering College" },
    { name: "Stanley College of Engineering, Keesara", lat: 17.4450, lon: 78.6050, category: "Engineering College" },
    { name: "ACE Engineering College, Ghatkesar", lat: 17.4520, lon: 78.6280, category: "Engineering College" },
    { name: "Sphoorthy Engineering College, Ghatkesar", lat: 17.4600, lon: 78.6150, category: "Engineering College" },
    { name: "Avanthi Institute of Engineering, Ghatkesar", lat: 17.4650, lon: 78.6300, category: "Engineering College" },
    { name: "Narsimha Reddy Engineering College (VNRVJIET Campus), Ghatkesar", lat: 17.4480, lon: 78.6180, category: "Engineering College" },
    // Engineering Colleges — Hyderabad
    { name: "IIT Hyderabad, Kandi", lat: 17.5915, lon: 78.1234, category: "Engineering College" },
    { name: "JNTU Hyderabad", lat: 17.4933, lon: 78.3918, category: "Engineering College" },
    { name: "Osmania University College of Engineering", lat: 17.4126, lon: 78.5228, category: "Engineering College" },
    { name: "IIIT Hyderabad, Gachibowli", lat: 17.4455, lon: 78.3489, category: "Engineering College" },
    { name: "BITS Pilani Hyderabad Campus", lat: 17.5449, lon: 78.5718, category: "Engineering College" },
    { name: "University of Hyderabad", lat: 17.4604, lon: 78.3340, category: "Engineering College" },
    { name: "CBIT, Gandipet", lat: 17.3500, lon: 78.3194, category: "Engineering College" },
    { name: "Vasavi College of Engineering, Ibrahimbagh", lat: 17.3893, lon: 78.4483, category: "Engineering College" },
    { name: "VNR VJIET, Bachupally", lat: 17.5382, lon: 78.3833, category: "Engineering College" },
    { name: "MVSR Engineering College, Nadergul", lat: 17.3327, lon: 78.5522, category: "Engineering College" },
    { name: "Muffakham Jah College of Engineering", lat: 17.4336, lon: 78.4458, category: "Engineering College" },
    { name: "Gokaraju Rangaraju Institute (GRIET), Bachupally", lat: 17.5157, lon: 78.3674, category: "Engineering College" },
    { name: "BVRIT, Narsapur", lat: 17.5620, lon: 78.3000, category: "Engineering College" },
    { name: "MLR Institute of Technology, Dundigal", lat: 17.5560, lon: 78.3778, category: "Engineering College" },
    { name: "Vardhaman College of Engineering, Shamshabad", lat: 17.5308, lon: 78.2880, category: "Engineering College" },
    { name: "Matrusri Engineering College, Saidabad", lat: 17.3872, lon: 78.5193, category: "Engineering College" },
    { name: "Mahindra University, Bahadurpally", lat: 17.5850, lon: 78.4100, category: "Engineering College" },
    { name: "CMR College of Engineering, Kandlakoya", lat: 17.5490, lon: 78.4860, category: "Engineering College" },
    { name: "Malla Reddy College of Engineering, Secunderabad", lat: 17.5000, lon: 78.5600, category: "Engineering College" },
    { name: "Keshav Memorial Institute of Technology (KMIT)", lat: 17.4850, lon: 78.3740, category: "Engineering College" },
    { name: "Bhoj Reddy Engineering College for Women, Vinay Nagar", lat: 17.3550, lon: 78.5100, category: "Engineering College" },
    { name: "G Narayanamma Institute of Technology (GNITS)", lat: 17.3700, lon: 78.3820, category: "Engineering College" },
    { name: "Lords Institute of Engineering and Technology", lat: 17.3650, lon: 78.4700, category: "Engineering College" },
    { name: "Deccan College of Engineering and Technology", lat: 17.3630, lon: 78.4420, category: "Engineering College" },
    { name: "Kommuri Pratap Reddy Institute of Technology (KPRIT)", lat: 17.4560, lon: 78.6400, category: "Engineering College" },
    { name: "Vignan Institute of Technology & Science (VITS), Deshmukhi", lat: 17.4200, lon: 78.6500, category: "Engineering College" },
    { name: "Princeton College of Engineering, Ghatkesar", lat: 17.4550, lon: 78.6250, category: "Engineering College" },
    { name: "Samskruti College of Engineering, Ghatkesar", lat: 17.4420, lon: 78.6320, category: "Engineering College" },
    { name: "St. Martin's Engineering College, Kompally", lat: 17.5400, lon: 78.4900, category: "Engineering College" },
    { name: "KG Reddy College of Engineering, Chilkur", lat: 17.3200, lon: 78.3500, category: "Engineering College" },
    { name: "Hyderabad Institute of Technology (HITAM), Gowdavelly", lat: 17.5100, lon: 78.6000, category: "Engineering College" },
    { name: "Vignan's Institute of Management and Technology for Women, Ghatkesar", lat: 17.4530, lon: 78.6230, category: "Engineering College" },
    // Medical Colleges
    { name: "Gandhi Medical College", lat: 17.3819, lon: 78.4744, category: "Medical College" },
    { name: "Osmania Medical College", lat: 17.3762, lon: 78.4830, category: "Medical College" },
    { name: "Deccan College of Medical Sciences", lat: 17.3661, lon: 78.4436, category: "Medical College" },
    { name: "NIMS, Punjagutta", lat: 17.4217, lon: 78.4522, category: "Medical College" },
    { name: "ESIC Medical College", lat: 17.3797, lon: 78.5647, category: "Medical College" },
    { name: "Apollo Medical College", lat: 17.4131, lon: 78.4380, category: "Medical College" },
    { name: "MediCiti Institute", lat: 17.2800, lon: 78.6200, category: "Medical College" },
    // Schools
    { name: "Hyderabad Public School, Begumpet", lat: 17.4425, lon: 78.4614, category: "School" },
    { name: "Chirec International School", lat: 17.4555, lon: 78.3877, category: "School" },
    { name: "Oakridge International School", lat: 17.3736, lon: 78.3477, category: "School" },
    { name: "DPS, Miyapur", lat: 17.4960, lon: 78.3540, category: "School" },
    { name: "Meridian School, Madhapur", lat: 17.4510, lon: 78.3860, category: "School" },
    { name: "Glendale Academy, Bandlaguda", lat: 17.3365, lon: 78.3879, category: "School" },
    { name: "Johnson Grammar School, Habsiguda", lat: 17.4053, lon: 78.5360, category: "School" },
    { name: "St. Ann's High School, Secunderabad", lat: 17.4380, lon: 78.4960, category: "School" },
    { name: "Kendriya Vidyalaya, Picket", lat: 17.4541, lon: 78.5019, category: "School" },
    { name: "Slate The School, Kondapur", lat: 17.4600, lon: 78.3700, category: "School" },
    // Restaurants
    { name: "Paradise Restaurant, Secunderabad", lat: 17.4399, lon: 78.4983, category: "Restaurant" },
    { name: "Bawarchi Restaurant, RTC X Roads", lat: 17.4037, lon: 78.4906, category: "Restaurant" },
    { name: "Shah Ghouse, Tolichowki", lat: 17.3958, lon: 78.4160, category: "Restaurant" },
    { name: "Chutneys, Banjara Hills", lat: 17.4152, lon: 78.4367, category: "Restaurant" },
    { name: "Pista House, Charminar", lat: 17.3616, lon: 78.4747, category: "Restaurant" },
    { name: "Cafe Bahar, Basheerbagh", lat: 17.3989, lon: 78.4749, category: "Restaurant" },
    { name: "Minerva Coffee Shop, Himayatnagar", lat: 17.4011, lon: 78.4880, category: "Restaurant" },
    // IT Hubs
    { name: "Hitech City", lat: 17.4435, lon: 78.3772, category: "IT Hub" },
    { name: "Gachibowli", lat: 17.4400, lon: 78.3489, category: "IT Hub" },
    { name: "Madhapur", lat: 17.4486, lon: 78.3908, category: "IT Hub" },
    { name: "Kondapur", lat: 17.4600, lon: 78.3650, category: "IT Hub" },
    { name: "Financial District", lat: 17.4218, lon: 78.3400, category: "IT Hub" },
    { name: "Mindspace, Madhapur", lat: 17.4447, lon: 78.3817, category: "IT Hub" },
    { name: "DLF Cyber City, Gachibowli", lat: 17.4292, lon: 78.3434, category: "IT Hub" },
    // Areas
    { name: "Jubilee Hills", lat: 17.4318, lon: 78.4073, category: "Area" },
    { name: "Banjara Hills", lat: 17.4138, lon: 78.4382, category: "Area" },
    { name: "Ameerpet", lat: 17.4375, lon: 78.4483, category: "Area" },
    { name: "Kukatpally", lat: 17.4849, lon: 78.3992, category: "Area" },
    { name: "Dilsukhnagar", lat: 17.3687, lon: 78.5247, category: "Area" },
    { name: "LB Nagar", lat: 17.3457, lon: 78.5522, category: "Area" },
    { name: "Secunderabad Junction", lat: 17.4344, lon: 78.5013, category: "Area" },
    { name: "Begumpet", lat: 17.4444, lon: 78.4680, category: "Area" },
    { name: "Uppal", lat: 17.3984, lon: 78.5600, category: "Area" },
    { name: "Habsiguda", lat: 17.4053, lon: 78.5360, category: "Area" },
    { name: "Tarnaka", lat: 17.4222, lon: 78.5311, category: "Area" },
    { name: "Miyapur", lat: 17.4975, lon: 78.3526, category: "Area" },
    { name: "Manikonda", lat: 17.4050, lon: 78.3775, category: "Area" },
    { name: "Narsingi", lat: 17.3853, lon: 78.3464, category: "Area" },
    { name: "Chandanagar", lat: 17.4950, lon: 78.3260, category: "Area" },
    { name: "Kompally", lat: 17.5375, lon: 78.4857, category: "Area" },
    { name: "Alwal", lat: 17.5025, lon: 78.5168, category: "Area" },
    { name: "Malkajgiri", lat: 17.4534, lon: 78.5230, category: "Area" },
    { name: "ECIL", lat: 17.4700, lon: 78.5700, category: "Area" },
    { name: "Nacharam", lat: 17.4300, lon: 78.5565, category: "Area" },
    { name: "Sainikpuri", lat: 17.4870, lon: 78.5540, category: "Area" },
    { name: "AS Rao Nagar", lat: 17.4670, lon: 78.5456, category: "Area" },
    { name: "Bowenpally", lat: 17.4650, lon: 78.4795, category: "Area" },
    { name: "Shamshabad Airport (RGIA)", lat: 17.2403, lon: 78.4294, category: "Area" },
    { name: "Nampally", lat: 17.3889, lon: 78.4686, category: "Area" },
    { name: "Abids", lat: 17.3932, lon: 78.4738, category: "Area" },
    { name: "Koti", lat: 17.3858, lon: 78.4855, category: "Area" },
    { name: "Lakdi Ka Pul", lat: 17.4050, lon: 78.4600, category: "Area" },
    { name: "Mehdipatnam", lat: 17.3942, lon: 78.4386, category: "Area" },
    { name: "Tolichowki", lat: 17.3944, lon: 78.4123, category: "Area" },
    { name: "Attapur", lat: 17.3718, lon: 78.4220, category: "Area" },
    { name: "Rajendranagar", lat: 17.3264, lon: 78.4400, category: "Area" },
    { name: "Shamirpet", lat: 17.5700, lon: 78.5600, category: "Area" },
    { name: "Patancheru", lat: 17.5327, lon: 78.2640, category: "Area" },
    // Hospitals
    { name: "Apollo Hospital, Jubilee Hills", lat: 17.4258, lon: 78.4100, category: "Hospital" },
    { name: "KIMS Hospital, Secunderabad", lat: 17.4465, lon: 78.4961, category: "Hospital" },
    { name: "Care Hospital, Banjara Hills", lat: 17.4140, lon: 78.4440, category: "Hospital" },
    { name: "Yashoda Hospital, Somajiguda", lat: 17.4261, lon: 78.4577, category: "Hospital" },
    { name: "Continental Hospital, Gachibowli", lat: 17.4250, lon: 78.3410, category: "Hospital" },
    { name: "Osmania General Hospital", lat: 17.3762, lon: 78.4830, category: "Hospital" },
    // Malls
    { name: "Inorbit Mall, Madhapur", lat: 17.4352, lon: 78.3847, category: "Mall" },
    { name: "GVK One Mall, Banjara Hills", lat: 17.4192, lon: 78.4458, category: "Mall" },
    { name: "Forum Sujana Mall, Kukatpally", lat: 17.4853, lon: 78.3910, category: "Mall" },
    { name: "Sarath City Capital Mall", lat: 17.4573, lon: 78.3658, category: "Mall" },
    { name: "Manjeera Mall, Kukatpally", lat: 17.4879, lon: 78.3940, category: "Mall" },
    { name: "City Center Mall, Banjara Hills", lat: 17.4137, lon: 78.4430, category: "Mall" },
    // Metro Stations
    { name: "Miyapur Metro Station", lat: 17.4969, lon: 78.3510, category: "Metro" },
    { name: "Ameerpet Metro Station", lat: 17.4375, lon: 78.4480, category: "Metro" },
    { name: "Nagole Metro Station", lat: 17.3857, lon: 78.5567, category: "Metro" },
    { name: "LB Nagar Metro Station", lat: 17.3455, lon: 78.5520, category: "Metro" },
    { name: "Raidurg Metro Station", lat: 17.4382, lon: 78.3705, category: "Metro" },
    { name: "JNTU Metro Station", lat: 17.4933, lon: 78.3900, category: "Metro" },
    { name: "Kukatpally Metro Station", lat: 17.4849, lon: 78.3990, category: "Metro" },
    { name: "Dilsukhnagar Metro Station", lat: 17.3687, lon: 78.5247, category: "Metro" },
    { name: "Secunderabad East Metro Station", lat: 17.4344, lon: 78.5050, category: "Metro" },
    { name: "Tarnaka Metro Station", lat: 17.4222, lon: 78.5311, category: "Metro" },
    { name: "Habsiguda Metro Station", lat: 17.4053, lon: 78.5360, category: "Metro" },
    // Bus & Railway
    { name: "Mahatma Gandhi Bus Station (MGBS)", lat: 17.3750, lon: 78.4850, category: "Bus Station" },
    { name: "Jubilee Bus Station (JBS)", lat: 17.4530, lon: 78.4870, category: "Bus Station" },
    { name: "Secunderabad Railway Station", lat: 17.4344, lon: 78.5013, category: "Railway" },
    { name: "Hyderabad Deccan (Nampally) Station", lat: 17.3889, lon: 78.4686, category: "Railway" },
    { name: "Kacheguda Railway Station", lat: 17.3850, lon: 78.4930, category: "Railway" },
    { name: "Ghatkesar Railway Station", lat: 17.4500, lon: 78.6200, category: "Railway" },
    // Entertainment
    { name: "PVR ICON, Hitech City", lat: 17.4435, lon: 78.3772, category: "Entertainment" },
    { name: "AMB Cinemas, Gachibowli", lat: 17.4292, lon: 78.3434, category: "Entertainment" },
    { name: "Prasads IMAX, Necklace Road", lat: 17.4100, lon: 78.4734, category: "Entertainment" },
    // Parks
    { name: "KBR National Park", lat: 17.4230, lon: 78.4250, category: "Park" },
    { name: "Indira Park, Domalguda", lat: 17.4100, lon: 78.4820, category: "Park" },
    { name: "Durgam Cheruvu Park", lat: 17.4350, lon: 78.3780, category: "Park" },
    // Tourist Places
    { name: "Himayat Sagar", lat: 17.3300, lon: 78.3800, category: "Tourist Place" },
    { name: "Osman Sagar (Gandipet Lake)", lat: 17.3700, lon: 78.3100, category: "Tourist Place" },
    { name: "Durgam Cheruvu (Secret Lake)", lat: 17.4350, lon: 78.3780, category: "Tourist Place" },
    { name: "Mrigavani National Park", lat: 17.3350, lon: 78.4450, category: "Tourist Place" },
    { name: "Necklace Road", lat: 17.4150, lon: 78.4700, category: "Tourist Place" },
    { name: "Taramati Baradari", lat: 17.3750, lon: 78.3950, category: "Tourist Place" },
];

const allLocations = [...hyderabadLocations, ...ghmcLocations];

/**
 * Search locations by name (fuzzy, case-insensitive).
 * @param {string} query
 * @param {number} [limit=8]
 * @returns {Array}
 */
function searchLocations(query, limit = 8) {
    const q = query.toLowerCase();
    return allLocations
        .filter(loc => loc.name.toLowerCase().includes(q))
        .slice(0, limit);
}

/**
 * Get coordinates for a location name.
 * Returns Hyderabad centre if not found.
 * @param {string} name
 * @returns {{ lat: number, lon: number }}
 */
function getCoordsForLocation(name) {
    const q = name.toLowerCase();
    const match = allLocations.find(loc => loc.name && loc.name.toLowerCase().includes(q));
    return match ? { lat: match.lat, lon: match.lon } : { lat: 17.3850, lon: 78.4867 };
}

// Ensure the new JSON is exposed, too
module.exports = { hyderabadLocations: allLocations, searchLocations, getCoordsForLocation };
