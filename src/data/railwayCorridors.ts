/**
 * Pre-computed railway corridor waypoints for major Indian routes.
 * Waypoints follow the actual track geometry shown on the Indian Railways
 * Network schematic (Western, Central, South Central, Eastern zones etc.)
 *
 * Coordinates are [lat, lng] and use city-centre / junction accuracy.
 * All corridors are stored one-way; lookup is symmetric.
 */

type LatLng = [number, number];

// ── Shared intermediate points ────────────────────────────────────────────────
const PT = {
  //  North / NCR
  DELHI:         [28.6139,  77.2090] as LatLng,
  MATHURA:       [27.4911,  77.6732] as LatLng,
  AGRA:          [27.1558,  77.9834] as LatLng,
  TUNDLA:        [27.2100,  78.2300] as LatLng,
  ALIGARH:       [27.8974,  78.0880] as LatLng,
  KANPUR:        [26.4599,  80.3449] as LatLng,
  ALWAR:         [27.5530,  76.6346] as LatLng,
  BHARATPUR:     [27.2172,  77.4930] as LatLng,
  AMBALA:        [30.3790,  76.9270] as LatLng,
  LUDHIANA:      [30.9010,  75.8573] as LatLng,
  JALANDHAR:     [31.3252,  75.5762] as LatLng,
  AMRITSAR:      [31.6340,  74.8723] as LatLng,
  SAHARANPUR:    [29.9680,  77.5456] as LatLng,
  HARIDWAR:      [29.9457,  78.1642] as LatLng,
  ROORKEE:       [29.8544,  77.8877] as LatLng,
  DEHRADUN:      [30.3165,  78.0322] as LatLng,
  CHANDIGARH:    [30.6805,  76.7799] as LatLng,
  MORADABAD:     [28.8389,  78.7738] as LatLng,
  BAREILLY:      [28.3638,  79.4254] as LatLng,

  //  UP / Bihar / East
  PRAYAGRAJ:     [25.4358,  81.8463] as LatLng,
  VARANASI:      [25.3176,  82.9739] as LatLng,
  PATNA:         [25.5941,  85.1376] as LatLng,
  GAYA:          [24.7869,  84.9930] as LatLng,
  DHANBAD:       [23.7997,  86.4534] as LatLng,
  GOMOH:         [23.8700,  86.1500] as LatLng,
  ASANSOL:       [23.6835,  86.9666] as LatLng,
  BURDWAN:       [23.2324,  87.8614] as LatLng,
  KHARAGPUR:     [22.3436,  87.3308] as LatLng,
  KOLKATA:       [22.5726,  88.3639] as LatLng,
  MUGHAL_SARAI:  [25.2810,  83.1175] as LatLng,
  LUCKNOW:       [26.8467,  80.9462] as LatLng,
  GORAKHPUR:     [26.7521,  83.3705] as LatLng,

  //  West Bengal / Odisha / NE
  CUTTACK:       [20.4686,  85.8830] as LatLng,
  BHUBANESWAR:   [20.2961,  85.8245] as LatLng,
  BRAHMAPUR:     [19.3150,  84.7941] as LatLng,
  VISAKHAPATNAM: [17.6868,  83.2185] as LatLng,
  VIJAYAWADA:    [16.5062,  80.6480] as LatLng,
  WARANGAL:      [18.0000,  79.5800] as LatLng,
  KAZIPET:       [17.9802,  79.5014] as LatLng,
  SECUNDERABAD:  [17.4341,  78.5003] as LatLng,
  HYDERABAD:     [17.3850,  78.4867] as LatLng,
  KURNOOL:       [15.8281,  78.0373] as LatLng,
  GUNTAKAL:      [15.1686,  77.3676] as LatLng,
  DHARMAVARAM:   [14.4126,  77.7157] as LatLng,
  NELLORE:       [14.4426,  79.9865] as LatLng,
  GUDUR:         [14.1494,  79.8504] as LatLng,
  CHENNAI:       [13.0827,  80.2707] as LatLng,
  KATPADI:       [12.9254,  79.1323] as LatLng,
  TIRUPATI:      [13.6288,  79.4192] as LatLng,
  RENIGUNTA:     [13.6344,  79.5114] as LatLng,

  //  Central / MP / CG
  JHANSI:        [25.4477,  78.5692] as LatLng,
  BHOPAL:        [23.2599,  77.4126] as LatLng,
  ITARSI:        [22.6139,  77.7616] as LatLng,
  NAGPUR:        [21.1458,  79.0882] as LatLng,
  WARDHA:        [20.7571,  78.6019] as LatLng,
  SEVAGRAM:      [20.7724,  78.6427] as LatLng,
  RAIPUR:        [21.2514,  81.6296] as LatLng,
  BILASPUR:      [22.2010,  82.0160] as LatLng,
  JHARSUGUDA:    [21.8500,  84.0100] as LatLng,
  SAMBALPUR:     [21.4669,  83.9812] as LatLng,
  ROURKELA:      [22.2510,  84.8828] as LatLng,

  //  Rajasthan
  JAIPUR:        [26.9124,  75.7873] as LatLng,
  KOTA:          [25.1792,  75.8441] as LatLng,
  RATLAM:        [23.3277,  75.0419] as LatLng,
  UDAIPUR:       [24.5854,  73.7125] as LatLng,
  AJMER:         [26.4516,  74.6424] as LatLng,

  //  Gujarat
  VADODARA:      [22.3072,  73.1812] as LatLng,
  SURAT:         [21.1702,  72.8311] as LatLng,
  VALSAD:        [20.5976,  72.9327] as LatLng,
  AHMEDABAD:     [23.0225,  72.5714] as LatLng,
  ANAND:         [22.5570,  72.9620] as LatLng,

  //  Maharashtra
  MUMBAI:        [18.9400,  72.8355] as LatLng,
  THANE:         [19.1889,  72.9710] as LatLng,
  KALYAN:        [19.2450,  73.1350] as LatLng,
  PANVEL:        [18.9949,  73.1126] as LatLng,
  KARJAT:        [18.9074,  73.3175] as LatLng,
  IGATPURI:      [19.7012,  73.5590] as LatLng,
  NASHIK:        [19.9967,  73.8013] as LatLng,
  MANMAD:        [20.2517,  74.4408] as LatLng,
  BHUSAWAL:      [21.0429,  75.7783] as LatLng,
  JALGAON:       [21.0100,  75.5600] as LatLng,
  AKOLA:         [20.7097,  77.0058] as LatLng,
  BADNERA:       [20.8700,  77.1700] as LatLng,
  PUNE:          [18.5204,  73.8567] as LatLng,
  DAUND:         [18.4612,  74.5739] as LatLng,
  SOLAPUR:       [17.6788,  75.9064] as LatLng,
  ROHA:          [18.4400,  73.1300] as LatLng,
  CHIPLUN:       [17.5326,  73.5119] as LatLng,
  RATNAGIRI:     [17.0036,  73.3009] as LatLng,
  KANKAVLI:      [16.4100,  73.7100] as LatLng,
  KUDAL:         [15.9800,  73.6900] as LatLng,
  WADI:          [16.9726,  76.9717] as LatLng,
  GULBARGA:      [17.3300,  76.8247] as LatLng,
  BIDAR:         [17.9104,  77.5199] as LatLng,
  NANDED:        [19.1594,  77.3107] as LatLng,

  //  Karnataka / Goa
  MADGAON:       [15.3596,  73.9381] as LatLng,
  GOA:           [15.2993,  74.1240] as LatLng,
  HUBLI:         [15.3647,  75.1240] as LatLng,
  DAVANGERE:     [14.4663,  75.9295] as LatLng,
  TUMKUR:        [13.3407,  77.0994] as LatLng,
  BANGALORE:     [12.9716,  77.5946] as LatLng,
  MYSORE:        [12.2958,  76.6394] as LatLng,
  ARSIKERE:      [13.3140,  76.2603] as LatLng,
  HASAN:         [13.0000,  76.0900] as LatLng,
  MANGALORE:     [12.8698,  74.8426] as LatLng,
  SHORANUR:      [10.8505,  76.5224] as LatLng,

  //  Tamil Nadu / Kerala
  COIMBATORE:    [11.0168,  76.9558] as LatLng,
  PALAKKAD:      [10.7739,  76.6516] as LatLng,
  ERODE:         [11.3405,  77.7202] as LatLng,
  SALEM:         [11.6527,  78.1560] as LatLng,
  JOLARPETTAI:   [12.5600,  78.5800] as LatLng,
  TIRUCHIRAPPALLI:[10.8128, 78.6873] as LatLng,
  MADURAI:       [ 9.9252,  78.1198] as LatLng,
  TIRUNELVELI:   [ 8.7600,  77.6900] as LatLng,
  NAGERCOIL:     [ 8.1698,  77.4197] as LatLng,
  KOCHI:         [ 9.9312,  76.2673] as LatLng,
  THRISSUR:      [10.5276,  76.2144] as LatLng,
  KOZHIKODE:     [11.2588,  75.7804] as LatLng,
  TRIVANDRUM:    [ 8.5241,  76.9366] as LatLng,
  ALLEPPEY:      [ 9.4981,  76.3388] as LatLng,
  KOLLAM:        [ 8.8932,  76.6141] as LatLng,

  //  Assam / NE
  GUWAHATI:      [26.1445,  91.7362] as LatLng,
  LUMDING:       [25.7430,  93.1719] as LatLng,
  NJP:           [26.7027,  88.3538] as LatLng,  // New Jalpaiguri
  MALDA:         [25.0169,  88.1463] as LatLng,

  //  Punjab / HP
  KALKA:         [30.8478,  77.1320] as LatLng,
};

/** Railway corridors: list of waypoints from end A to end B */
type Corridor = LatLng[];

interface CorridorEntry {
  a: string[];  // canonical name variants for city A
  b: string[];  // canonical name variants for city B
  paths: Corridor[];  // one or more distinct corridor options
}

const CORRIDORS: CorridorEntry[] = [
  // ── Delhi ↔ Mumbai (Western Railway – Rajdhani / Duronto route) ──────────
  {
    a: ['delhi','new delhi'],
    b: ['mumbai','bombay'],
    paths: [[PT.DELHI, PT.MATHURA, PT.KOTA, PT.RATLAM, PT.VADODARA, PT.SURAT, PT.VALSAD, PT.MUMBAI]]
  },

  // ── Delhi ↔ Mumbai (Central – via Bhopal/Jhansi) ─────────────────────────
  // (secondary, only used when no Western match; same endpoints)

  // ── Delhi ↔ Jaipur ───────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['jaipur'],
    paths: [[PT.DELHI, PT.MATHURA, PT.BHARATPUR, PT.JAIPUR]]
  },

  // ── Delhi ↔ Ajmer ────────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['ajmer'],
    paths: [[PT.DELHI, PT.MATHURA, PT.BHARATPUR, PT.JAIPUR, PT.AJMER]]
  },

  // ── Delhi ↔ Udaipur ──────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['udaipur'],
    paths: [[PT.DELHI, PT.MATHURA, PT.KOTA, PT.RATLAM, PT.UDAIPUR]]
  },

  // ── Delhi ↔ Ahmedabad ────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['ahmedabad'],
    paths: [[PT.DELHI, PT.MATHURA, PT.KOTA, PT.RATLAM, PT.VADODARA, PT.ANAND, PT.AHMEDABAD]]
  },

  // ── Delhi ↔ Lucknow ──────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['lucknow'],
    paths: [[PT.DELHI, PT.ALIGARH, PT.KANPUR, PT.LUCKNOW]]
  },

  // ── Delhi ↔ Varanasi ─────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['varanasi'],
    paths: [[PT.DELHI, PT.KANPUR, PT.PRAYAGRAJ, PT.MUGHAL_SARAI, PT.VARANASI]]
  },

  // ── Delhi ↔ Patna ────────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['patna'],
    paths: [[PT.DELHI, PT.KANPUR, PT.PRAYAGRAJ, PT.VARANASI, PT.MUGHAL_SARAI, PT.PATNA]]
  },

  // ── Delhi ↔ Kolkata ──────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['kolkata','calcutta'],
    paths: [[PT.DELHI, PT.KANPUR, PT.PRAYAGRAJ, PT.VARANASI, PT.MUGHAL_SARAI, PT.PATNA, PT.GAYA, PT.DHANBAD, PT.ASANSOL, PT.BURDWAN, PT.KOLKATA]]
  },

  // ── Delhi ↔ Bhubaneswar ──────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['bhubaneswar'],
    paths: [[PT.DELHI, PT.KANPUR, PT.PRAYAGRAJ, PT.VARANASI, PT.PATNA, PT.DHANBAD, PT.KHARAGPUR, PT.BHUBANESWAR]]
  },

  // ── Delhi ↔ Hyderabad ────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['hyderabad','secunderabad'],
    paths: [[PT.DELHI, PT.AGRA, PT.JHANSI, PT.BHOPAL, PT.ITARSI, PT.NAGPUR, PT.KAZIPET, PT.SECUNDERABAD]]
  },

  // ── Delhi ↔ Visakhapatnam ────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['visakhapatnam','vishakhapatnam'],
    paths: [[PT.DELHI, PT.AGRA, PT.JHANSI, PT.BHOPAL, PT.ITARSI, PT.NAGPUR, PT.KAZIPET, PT.SECUNDERABAD, PT.VIJAYAWADA, PT.VISAKHAPATNAM]]
  },

  // ── Delhi ↔ Chennai ──────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['chennai','madras'],
    paths: [[PT.DELHI, PT.AGRA, PT.JHANSI, PT.BHOPAL, PT.ITARSI, PT.NAGPUR, PT.KAZIPET, PT.SECUNDERABAD, PT.VIJAYAWADA, PT.NELLORE, PT.GUDUR, PT.CHENNAI]]
  },

  // ── Delhi ↔ Bangalore ────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['bangalore','bengaluru'],
    paths: [[PT.DELHI, PT.AGRA, PT.JHANSI, PT.BHOPAL, PT.ITARSI, PT.NAGPUR, PT.KAZIPET, PT.SECUNDERABAD, PT.KURNOOL, PT.DHARMAVARAM, PT.BANGALORE]]
  },

  // ── Delhi ↔ Amritsar ─────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['amritsar'],
    paths: [[PT.DELHI, PT.AMBALA, PT.LUDHIANA, PT.JALANDHAR, PT.AMRITSAR]]
  },

  // ── Delhi ↔ Chandigarh ───────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['chandigarh'],
    paths: [[PT.DELHI, PT.AMBALA, PT.CHANDIGARH]]
  },

  // ── Delhi ↔ Dehradun ─────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['dehradun'],
    paths: [[PT.DELHI, PT.SAHARANPUR, PT.HARIDWAR, PT.ROORKEE, PT.DEHRADUN]]
  },

  // ── Delhi ↔ Haridwar / Rishikesh ─────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['haridwar','rishikesh'],
    paths: [[PT.DELHI, PT.SAHARANPUR, PT.HARIDWAR]]
  },

  // ── Delhi ↔ Nagpur ───────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['nagpur'],
    paths: [[PT.DELHI, PT.AGRA, PT.JHANSI, PT.BHOPAL, PT.ITARSI, PT.NAGPUR]]
  },

  // ── Delhi ↔ Bhopal ───────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['bhopal'],
    paths: [[PT.DELHI, PT.AGRA, PT.JHANSI, PT.BHOPAL]]
  },

  // ── Delhi ↔ Indore ───────────────────────────────────────────────────────
  {
    a: ['delhi','new delhi'],
    b: ['indore'],
    paths: [[PT.DELHI, PT.MATHURA, PT.KOTA, PT.RATLAM, [22.7196, 75.8577] as LatLng]]
  },

  // ── Mumbai ↔ Pune ────────────────────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['pune'],
    paths: [[PT.MUMBAI, PT.THANE, PT.KARJAT, PT.PUNE]]
  },

  // ── Mumbai ↔ Goa (Konkan Railway) ────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['goa','panaji'],
    paths: [[PT.MUMBAI, PT.THANE, PT.PANVEL, PT.ROHA, PT.CHIPLUN, PT.RATNAGIRI, PT.KANKAVLI, PT.KUDAL, PT.MADGAON]]
  },

  // ── Mumbai ↔ Hyderabad ───────────────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['hyderabad','secunderabad'],
    paths: [[PT.MUMBAI, PT.THANE, PT.KARJAT, PT.IGATPURI, PT.MANMAD, PT.NANDED, PT.SECUNDERABAD]]
  },

  // ── Mumbai ↔ Solapur/Bidar route → Hyderabad via Wadi ────────────────────
  // (alt Hyderabad via Daund route)
  {
    a: ['mumbai','bombay'],
    b: ['solapur'],
    paths: [[PT.MUMBAI, PT.PUNE, PT.DAUND, PT.SOLAPUR]]
  },

  // ── Mumbai ↔ Bangalore ───────────────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['bangalore','bengaluru'],
    paths: [[PT.MUMBAI, PT.PUNE, PT.SOLAPUR, PT.WADI, PT.GULBARGA, PT.DAVANGERE, PT.TUMKUR, PT.BANGALORE]]
  },

  // ── Mumbai ↔ Chennai ─────────────────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['chennai','madras'],
    paths: [[PT.MUMBAI, PT.PUNE, PT.SOLAPUR, PT.WADI, PT.SECUNDERABAD, PT.VIJAYAWADA, PT.NELLORE, PT.GUDUR, PT.CHENNAI]]
  },

  // ── Mumbai ↔ Kolkata (via Nagpur / Raipur) ───────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['kolkata','calcutta'],
    paths: [[PT.MUMBAI, PT.THANE, PT.IGATPURI, PT.NASHIK, PT.BHUSAWAL, PT.AKOLA, PT.BADNERA, PT.NAGPUR, PT.RAIPUR, PT.BILASPUR, PT.JHARSUGUDA, PT.SAMBALPUR, PT.ROURKELA, PT.KHARAGPUR, PT.KOLKATA]]
  },

  // ── Mumbai ↔ Nagpur ──────────────────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['nagpur'],
    paths: [[PT.MUMBAI, PT.THANE, PT.IGATPURI, PT.NASHIK, PT.MANMAD, PT.BHUSAWAL, PT.AKOLA, PT.BADNERA, PT.NAGPUR]]
  },

  // ── Mumbai ↔ Ahmedabad ───────────────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['ahmedabad'],
    paths: [[PT.MUMBAI, PT.SURAT, PT.VADODARA, PT.ANAND, PT.AHMEDABAD]]
  },

  // ── Mumbai ↔ Vadodara ────────────────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['vadodara'],
    paths: [[PT.MUMBAI, PT.SURAT, PT.VADODARA]]
  },

  // ── Mumbai ↔ Bhopal ──────────────────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['bhopal'],
    paths: [[PT.MUMBAI, PT.THANE, PT.IGATPURI, PT.NASHIK, PT.MANMAD, PT.BHUSAWAL, PT.JALGAON, [22.5, 76.5] as LatLng, PT.BHOPAL]]
  },

  // ── Mumbai ↔ Visakhapatnam ───────────────────────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['visakhapatnam','vishakhapatnam'],
    paths: [[PT.MUMBAI, PT.PUNE, PT.SOLAPUR, PT.WADI, PT.SECUNDERABAD, PT.VIJAYAWADA, PT.VISAKHAPATNAM]]
  },

  // ── Mumbai ↔ Trivandrum / Thiruvananthapuram ─────────────────────────────
  {
    a: ['mumbai','bombay'],
    b: ['thiruvananthapuram','trivandrum'],
    paths: [[PT.MUMBAI, PT.PUNE, PT.SOLAPUR, PT.WADI, [17.0, 76.8] as LatLng, PT.HUBLI, PT.MANGALORE, PT.SHORANUR, PT.KOCHI, PT.KOLLAM, PT.TRIVANDRUM]]
  },

  // ── Chennai ↔ Kolkata (East Coast) ───────────────────────────────────────
  {
    a: ['chennai','madras'],
    b: ['kolkata','calcutta'],
    paths: [[PT.CHENNAI, PT.NELLORE, PT.VIJAYAWADA, PT.VISAKHAPATNAM, PT.BRAHMAPUR, PT.BHUBANESWAR, PT.CUTTACK, PT.KHARAGPUR, PT.KOLKATA]]
  },

  // ── Chennai ↔ Bangalore ──────────────────────────────────────────────────
  {
    a: ['chennai','madras'],
    b: ['bangalore','bengaluru'],
    paths: [[PT.CHENNAI, PT.KATPADI, PT.JOLARPETTAI, PT.BANGALORE]]
  },

  // ── Chennai ↔ Hyderabad ──────────────────────────────────────────────────
  {
    a: ['chennai','madras'],
    b: ['hyderabad','secunderabad'],
    paths: [[PT.CHENNAI, PT.NELLORE, PT.GUDUR, PT.VIJAYAWADA, PT.KAZIPET, PT.SECUNDERABAD]]
  },

  // ── Chennai ↔ Kochi / Ernakulam ──────────────────────────────────────────
  {
    a: ['chennai','madras'],
    b: ['kochi','cochin'],
    paths: [[PT.CHENNAI, PT.TIRUCHIRAPPALLI, PT.ERODE, PT.COIMBATORE, PT.PALAKKAD, PT.SHORANUR, PT.KOCHI]]
  },

  // ── Chennai ↔ Trivandrum ─────────────────────────────────────────────────
  {
    a: ['chennai','madras'],
    b: ['thiruvananthapuram','trivandrum'],
    paths: [[PT.CHENNAI, PT.TIRUCHIRAPPALLI, PT.MADURAI, PT.TIRUNELVELI, PT.NAGERCOIL, PT.TRIVANDRUM]]
  },

  // ── Chennai ↔ Coimbatore ─────────────────────────────────────────────────
  {
    a: ['chennai','madras'],
    b: ['coimbatore'],
    paths: [[PT.CHENNAI, PT.JOLARPETTAI, PT.SALEM, PT.ERODE, PT.COIMBATORE]]
  },

  // ── Chennai ↔ Madurai ────────────────────────────────────────────────────
  {
    a: ['chennai','madras'],
    b: ['madurai'],
    paths: [[PT.CHENNAI, PT.TIRUCHIRAPPALLI, PT.MADURAI]]
  },

  // ── Bangalore ↔ Hyderabad ────────────────────────────────────────────────
  {
    a: ['bangalore','bengaluru'],
    b: ['hyderabad','secunderabad'],
    paths: [[PT.BANGALORE, PT.DHARMAVARAM, PT.KURNOOL, [17.0, 78.0] as LatLng, PT.SECUNDERABAD]]
  },

  // ── Bangalore ↔ Kochi ────────────────────────────────────────────────────
  {
    a: ['bangalore','bengaluru'],
    b: ['kochi','cochin'],
    paths: [[PT.BANGALORE, PT.MYSORE, PT.HASAN, PT.ARSIKERE, PT.SHORANUR, PT.THRISSUR, PT.KOCHI]]
  },

  // ── Bangalore ↔ Goa ──────────────────────────────────────────────────────
  {
    a: ['bangalore','bengaluru'],
    b: ['goa','panaji'],
    paths: [[PT.BANGALORE, PT.HUBLI, PT.MADGAON]]
  },

  // ── Bangalore ↔ Mumbai (alt) ─────────────────────────────────────────────
  // (already covered by Mumbai ↔ Bangalore, symmetric)

  // ── Bangalore ↔ Mysore ───────────────────────────────────────────────────
  {
    a: ['bangalore','bengaluru'],
    b: ['mysore','mysuru'],
    paths: [[PT.BANGALORE, PT.MYSORE]]
  },

  // ── Hyderabad ↔ Kolkata ──────────────────────────────────────────────────
  {
    a: ['hyderabad','secunderabad'],
    b: ['kolkata','calcutta'],
    paths: [[PT.SECUNDERABAD, PT.KAZIPET, PT.VIJAYAWADA, PT.VISAKHAPATNAM, PT.BRAHMAPUR, PT.BHUBANESWAR, PT.KHARAGPUR, PT.KOLKATA]]
  },

  // ── Bangalore ↔ Kolkata (East Coast – HWH-YPR Duronto/Superfast) ─────────
  {
    a: ['bangalore','bengaluru'],
    b: ['kolkata','calcutta'],
    paths: [[PT.BANGALORE, PT.SECUNDERABAD, PT.VIJAYAWADA, PT.VISAKHAPATNAM, PT.BRAHMAPUR, PT.BHUBANESWAR, PT.KHARAGPUR, PT.KOLKATA]]
  },
  // Bangalore ↔ Kolkata (via Guntakal → Secunderabad → Nagpur – alternate inland route)
  {
    a: ['bangalore','bengaluru'],
    b: ['kolkata','calcutta'],
    paths: [[PT.BANGALORE, PT.GUNTAKAL, PT.SECUNDERABAD, PT.NAGPUR, PT.RAIPUR, PT.BILASPUR, PT.JHARSUGUDA, PT.KHARAGPUR, PT.KOLKATA]]
  },

  // ── Kolkata ↔ Bhubaneswar ────────────────────────────────────────────────
  {
    a: ['kolkata','calcutta'],
    b: ['bhubaneswar'],
    paths: [[PT.KOLKATA, PT.KHARAGPUR, PT.BHUBANESWAR]]
  },

  // ── Kolkata ↔ Patna ──────────────────────────────────────────────────────
  {
    a: ['kolkata','calcutta'],
    b: ['patna'],
    paths: [[PT.KOLKATA, PT.ASANSOL, PT.DHANBAD, PT.GOMOH, PT.GAYA, PT.PATNA]]
  },

  // ── Kolkata ↔ Guwahati ───────────────────────────────────────────────────
  {
    a: ['kolkata','calcutta'],
    b: ['guwahati'],
    paths: [[PT.KOLKATA, PT.MALDA, PT.NJP, PT.GUWAHATI]]
  },

  // ── Kolkata ↔ Varanasi ───────────────────────────────────────────────────
  {
    a: ['kolkata','calcutta'],
    b: ['varanasi'],
    paths: [[PT.KOLKATA, PT.ASANSOL, PT.DHANBAD, PT.MUGHAL_SARAI, PT.VARANASI]]
  },

  // ── Kochi ↔ Trivandrum ───────────────────────────────────────────────────
  {
    a: ['kochi','cochin'],
    b: ['thiruvananthapuram','trivandrum'],
    paths: [[PT.KOCHI, PT.ALLEPPEY, PT.KOLLAM, PT.TRIVANDRUM]]
  },

  // ── Pune ↔ Nagpur ────────────────────────────────────────────────────────
  {
    a: ['pune'],
    b: ['nagpur'],
    paths: [[PT.PUNE, PT.DAUND, PT.SOLAPUR, PT.BADNERA, PT.NAGPUR]]
  },

  // ── Pune ↔ Hyderabad ─────────────────────────────────────────────────────
  {
    a: ['pune'],
    b: ['hyderabad','secunderabad'],
    paths: [[PT.PUNE, PT.SOLAPUR, PT.WADI, PT.SECUNDERABAD]]
  },

  // ── Jaipur ↔ Mumbai ──────────────────────────────────────────────────────
  {
    a: ['jaipur'],
    b: ['mumbai','bombay'],
    paths: [[PT.JAIPUR, PT.KOTA, PT.RATLAM, PT.VADODARA, PT.SURAT, PT.MUMBAI]]
  },

  // ── Jaipur ↔ Kolkata ─────────────────────────────────────────────────────
  {
    a: ['jaipur'],
    b: ['kolkata','calcutta'],
    paths: [[PT.JAIPUR, PT.AGRA, PT.KANPUR, PT.PRAYAGRAJ, PT.VARANASI, PT.PATNA, PT.DHANBAD, PT.KOLKATA]]
  },

  // ── Ahmedabad ↔ Hyderabad ────────────────────────────────────────────────
  {
    a: ['ahmedabad'],
    b: ['hyderabad','secunderabad'],
    paths: [[PT.AHMEDABAD, PT.VADODARA, PT.SURAT, PT.MUMBAI, PT.PUNE, PT.SOLAPUR, PT.WADI, PT.SECUNDERABAD]]
  },

  // ── Lucknow ↔ Kolkata ────────────────────────────────────────────────────
  {
    a: ['lucknow'],
    b: ['kolkata','calcutta'],
    paths: [[PT.LUCKNOW, PT.VARANASI, PT.PATNA, PT.DHANBAD, PT.ASANSOL, PT.BURDWAN, PT.KOLKATA]]
  },

  // ── Lucknow ↔ Patna ──────────────────────────────────────────────────────
  {
    a: ['lucknow'],
    b: ['patna'],
    paths: [[PT.LUCKNOW, PT.VARANASI, PT.MUGHAL_SARAI, PT.PATNA]]
  },
];

// ── Secondary corridors (routes with genuine alternative paths) ───────────────

// Mumbai ↔ Delhi: Central route via Kalyan → Igatpuri → Nashik → Bhusawal → Itarsi → Bhopal → Jhansi
// (in addition to the primary Western Railway via Surat → Vadodara → Kota)
const SECONDARY_CORRIDORS: CorridorEntry[] = [
  {
    a: ['mumbai','bombay'],
    b: ['delhi','new delhi'],
    paths: [[
      PT.MUMBAI, PT.THANE, PT.KALYAN, PT.IGATPURI, PT.NASHIK, PT.MANMAD,
      PT.BHUSAWAL, PT.ITARSI, PT.BHOPAL, PT.JHANSI, PT.AGRA, PT.DELHI
    ]]
  },
  // Mumbai ↔ Bangalore: Konkan + Hubli route (in addition to Pune→Solapur→Wadi)
  {
    a: ['mumbai','bombay'],
    b: ['bangalore','bengaluru'],
    paths: [[
      PT.MUMBAI, PT.THANE, PT.PANVEL, PT.ROHA, PT.CHIPLUN, PT.RATNAGIRI,
      PT.KANKAVLI, PT.KUDAL, PT.MADGAON, PT.HUBLI, PT.DAVANGERE, PT.TUMKUR, PT.BANGALORE
    ]]
  },
  // Mumbai ↔ Goa: inland route via Pune → Kolhapur → Miraj → Madgaon
  {
    a: ['mumbai','bombay'],
    b: ['goa','panaji'],
    paths: [[
      PT.MUMBAI, PT.PUNE, PT.DAUND,
      [17.6862, 74.2330] as LatLng, // Miraj/Sangli
      [16.8135, 74.1445] as LatLng, // Kolhapur
      [15.8500, 74.0000] as LatLng, // Londa
      PT.MADGAON
    ]]
  },
  // Delhi ↔ Kolkata: via Lucknow → Varanasi (Grand Chord is primary, this is through Lucknow)
  {
    a: ['delhi','new delhi'],
    b: ['kolkata','calcutta'],
    paths: [[
      PT.DELHI, PT.KANPUR, PT.LUCKNOW,
      [26.0000, 83.1700] as LatLng, // Ballia area
      PT.PATNA, PT.GAYA, PT.DHANBAD, PT.ASANSOL, PT.BURDWAN, PT.KOLKATA
    ]]
  },
  // Delhi ↔ Chennai: via Vijayawada (bypasses Secunderabad loop)
  {
    a: ['delhi','new delhi'],
    b: ['chennai','madras'],
    paths: [[
      PT.DELHI, PT.AGRA, PT.JHANSI, PT.BHOPAL, PT.ITARSI, PT.NAGPUR,
      PT.WARDHA, PT.KAZIPET, PT.VIJAYAWADA, PT.NELLORE, PT.GUDUR, PT.CHENNAI
    ]]
  },
  // Kolkata ↔ Chennai: via Balasore → Cuttack (interior route, not east coast)
  {
    a: ['kolkata','calcutta'],
    b: ['chennai','madras'],
    paths: [[
      PT.KOLKATA, PT.KHARAGPUR, PT.ROURKELA, PT.SAMBALPUR,
      PT.RAIPUR, PT.NAGPUR, PT.KAZIPET, PT.SECUNDERABAD,
      PT.KURNOOL, PT.DHARMAVARAM, PT.KATPADI, PT.CHENNAI
    ]]
  },
  // Mumbai ↔ Hyderabad: via Pune → Solapur → Wadi (already primary is via Nanded)
  {
    a: ['mumbai','bombay'],
    b: ['hyderabad','secunderabad'],
    paths: [[
      PT.MUMBAI, PT.PUNE, PT.SOLAPUR,
      [16.8302, 76.5587] as LatLng, // Gulbarga/Kalaburagi
      PT.WADI, PT.SECUNDERABAD
    ]]
  },
];

/** Normalize a city name for lookup */
function normalize(name: string): string {
  return name.trim().toLowerCase()
    .replace(/\bjunction\b|\bjn\b|\bcentral\b|\bcity\b|\bcantt\b/g, '')
    .trim();
}

function matchCorridor(
  corridor: CorridorEntry, a: string, b: string
): LatLng[][] | null {
  const matchA = corridor.a.some(k => a.includes(k) || k.includes(a));
  const matchB = corridor.b.some(k => b.includes(k) || k.includes(b));
  if (matchA && matchB) return corridor.paths.map(p => [...p]);

  const matchBA = corridor.b.some(k => a.includes(k) || k.includes(a));
  const matchAB = corridor.a.some(k => b.includes(k) || k.includes(b));
  if (matchBA && matchAB) return corridor.paths.map(p => [...p].reverse());

  return null;
}

/**
 * Returns ALL distinct railway corridor paths between two cities,
 * or null if no corridor is found.
 */
export function getRailwayCorridors(origin: string, destination: string): LatLng[][] | null {
  const a = normalize(origin);
  const b = normalize(destination);
  const results: LatLng[][] = [];

  const allCorridors = [...CORRIDORS, ...SECONDARY_CORRIDORS];

  for (const corridor of allCorridors) {
    const matched = matchCorridor(corridor, a, b);
    if (matched) {
      // Deduplicate by start + midpoint + end so that genuinely different
      // corridors sharing the same endpoints (e.g. Western Railway vs Central
      // Railway between Delhi and Mumbai) are both kept.
      for (const path of matched) {
        const midIdx = Math.floor(path.length / 2);
        const key  = path[0].join(',') + ':' + path[midIdx].join(',') + ':' + path[path.length-1].join(',');
        const keyR = path[path.length-1].join(',') + ':' + path[midIdx].join(',') + ':' + path[0].join(',');
        const alreadyHave = results.some(r => {
          const rm = Math.floor(r.length / 2);
          const rKey = r[0].join(',') + ':' + r[rm].join(',') + ':' + r[r.length-1].join(',');
          return rKey === key || rKey === keyR;
        });
        if (!alreadyHave) results.push(path);
      }
    }
  }
  return results.length ? results : null;
}

/** Convenience wrapper – returns the first (primary) corridor only */
export function getRailwayCorridor(origin: string, destination: string): LatLng[] | null {
  const all = getRailwayCorridors(origin, destination);
  return all ? all[0] : null;
}
