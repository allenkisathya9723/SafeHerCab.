export interface PoliceStation {
    name: string;
    address: string;
    phone: string;
    lat: number;
    lon: number;
}

export const hyderabadPoliceStations: PoliceStation[] = [
    { name: "Banjara Hills Police Station", address: "Road No. 12, Banjara Hills", phone: "040-27853507", lat: 17.4138, lon: 78.4382 },
    { name: "Jubilee Hills Police Station", address: "Road No. 36, Jubilee Hills", phone: "040-23551836", lat: 17.4318, lon: 78.4073 },
    { name: "Madhapur Police Station", address: "Ayyappa Society, Madhapur", phone: "040-23010895", lat: 17.4486, lon: 78.3908 },
    { name: "Gachibowli Police Station", address: "Gachibowli Main Road", phone: "040-23000100", lat: 17.4400, lon: 78.3489 },
    { name: "Kukatpally Police Station", address: "KPHB Colony, Kukatpally", phone: "040-23051500", lat: 17.4849, lon: 78.3992 },
    { name: "Miyapur Police Station", address: "Miyapur Main Road", phone: "040-23050400", lat: 17.4975, lon: 78.3526 },
    { name: "Begumpet Police Station", address: "Begumpet Main Road", phone: "040-27853502", lat: 17.4444, lon: 78.4680 },
    { name: "Secunderabad Police Station", address: "Near Clock Tower, Secunderabad", phone: "040-27853500", lat: 17.4344, lon: 78.5013 },
    { name: "Charminar Police Station", address: "Near Charminar", phone: "040-24521860", lat: 17.3616, lon: 78.4747 },
    { name: "Abids Police Station", address: "Abids Road", phone: "040-24736632", lat: 17.3932, lon: 78.4738 },
    { name: "Nampally Police Station", address: "Nampally Station Road", phone: "040-24612345", lat: 17.3889, lon: 78.4686 },
    { name: "Mehdipatnam Police Station", address: "Mehdipatnam Main Road", phone: "040-23516377", lat: 17.3942, lon: 78.4386 },
    { name: "LB Nagar Police Station", address: "LB Nagar Ring Road", phone: "040-24041424", lat: 17.3457, lon: 78.5522 },
    { name: "Dilsukhnagar Police Station", address: "Dilsukhnagar Main Road", phone: "040-24041400", lat: 17.3687, lon: 78.5247 },
    { name: "Uppal Police Station", address: "Uppal Main Road", phone: "040-27202541", lat: 17.3984, lon: 78.5600 },
    { name: "Ghatkesar Police Station", address: "Ghatkesar Town", phone: "040-29203456", lat: 17.4500, lon: 78.6200 },
    { name: "Kompally Police Station", address: "Kompally Main Road", phone: "040-27862345", lat: 17.5375, lon: 78.4857 },
    { name: "Shamshabad Police Station", address: "Near RGIA Airport", phone: "040-24084321", lat: 17.2403, lon: 78.4294 },
    { name: "Rajendranagar Police Station", address: "Rajendranagar", phone: "040-24014356", lat: 17.3264, lon: 78.4400 },
    { name: "Malkajgiri Police Station", address: "Malkajgiri Main Road", phone: "040-27050324", lat: 17.4534, lon: 78.5230 },
    { name: "Bowenpally Police Station", address: "Bowenpally Cross Road", phone: "040-27863456", lat: 17.4650, lon: 78.4795 },
    { name: "Kondapur Police Station", address: "Kondapur Main Road", phone: "040-23010700", lat: 17.4600, lon: 78.3650 },
    { name: "Cyberabad Police Commissionerate", address: "Cyberabad, Gachibowli", phone: "040-27853574", lat: 17.4218, lon: 78.3400 },
    { name: "Rachakonda Police Commissionerate", address: "Near Neredmet", phone: "040-27853500", lat: 17.4700, lon: 78.5456 },
];

export function findNearestStations(lat: number, lon: number, count = 3): (PoliceStation & { distanceKm: number })[] {
    const toRad = (n: number) => (n * Math.PI) / 180;
    const haversine = (a: [number, number], b: [number, number]) => {
        const R = 6371;
        const dLat = toRad(b[0] - a[0]);
        const dLon = toRad(b[1] - a[1]);
        const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    };

    return hyderabadPoliceStations
        .map((s) => ({ ...s, distanceKm: haversine([lat, lon], [s.lat, s.lon]) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, count);
}
