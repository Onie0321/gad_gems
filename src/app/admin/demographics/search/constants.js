import { ethnicGroups as sharedEthnicGroups } from "@/components/shared/EthnicitySelect";

export const schools = [
  "School of Accountancy and Business Management",
  "School of Arts and Sciences",
  "School of Computing and Information Technology",
  "School of Education",
  "School of Engineering and Architecture",
  "School of Hospitality and Tourism Management",
  "School of Law",
  "School of Medicine",
  "School of Nursing",
  "School of Pharmacy",
  "School of Public Administration",
  "School of Social Work",
  "School of Theology",
  "Other",
];

export const ethnicGroups = sharedEthnicGroups;

// Comprehensive Luzon provinces and cities mapping
export const luzonLocations = {
  // National Capital Region (NCR)
  "Metro Manila": [
    "manila",
    "makati",
    "pasig",
    "taguig",
    "pasay",
    "caloocan",
    "marikina",
    "paranaque",
    "las pinas",
    "muntinlupa",
    "malabon",
    "navotas",
    "san juan",
    "mandaluyong",
    "valenzuela",
    "pateros",
    "quezon city",
  ],

  // Region I - Ilocos Region
  "Ilocos Norte": [
    "ilocos norte",
    "laoag",
    "batac",
    "sarrat",
    "san nicolas",
    "paoay",
    "vintar",
  ],
  "Ilocos Sur": [
    "ilocos sur",
    "vigan",
    "candon",
    "santa",
    "santiago",
    "san esteban",
    "santa maria",
  ],
  "La Union": [
    "la union",
    "san fernando",
    "bauang",
    "naguilian",
    "san juan",
    "baguio",
  ],
  Pangasinan: [
    "pangasinan",
    "dagupan",
    "san carlos",
    "urdaneta",
    "lingayen",
    "alaminos",
    "malasiqui",
  ],

  // Region II - Cagayan Valley
  Batanes: [
    "batanes",
    "basco",
    "itbayat",
    "mahatao",
    "ivana",
    "sabtang",
    "uyugan",
  ],
  Cagayan: [
    "cagayan",
    "tuguegarao",
    "ilagan",
    "santiago",
    "cauayan",
    "tuao",
    "amulung",
  ],
  Isabela: [
    "isabela",
    "ilagan",
    "cauayan",
    "santiago",
    "roxas",
    "echague",
    "cabatuan",
  ],
  "Nueva Vizcaya": [
    "nueva vizcaya",
    "bayombong",
    "solano",
    "ambaguio",
    "alfonso castaneda",
    "aritao",
  ],
  Quirino: [
    "quirino",
    "cabarroguis",
    "diffun",
    "saguday",
    "maddela",
    "nagtipunan",
  ],

  // Region III - Central Luzon
  Aurora: [
    "aurora",
    "baler",
    "casiguran",
    "dinalungan",
    "dipaculao",
    "maria aurora",
    "dingalan",
    "san luis",
  ],
  Bataan: [
    "bataan",
    "balanga",
    "mariveles",
    "dinalupihan",
    "orani",
    "hermosa",
    "limay",
  ],
  Bulacan: [
    "bulacan",
    "malolos",
    "meyscauayan",
    "san jose del monte",
    "calumpit",
    "marilao",
    "bocaue",
  ],
  "Nueva Ecija": [
    "nueva ecija",
    "cabanatuan",
    "san jose",
    "gapan",
    "santa rosa",
    "peñaranda",
    "san antonio",
  ],
  Pampanga: [
    "pampanga",
    "angeles",
    "san fernando",
    "mabalacat",
    "san simon",
    "apalit",
    "candaba",
  ],
  Tarlac: [
    "tarlac",
    "tarlac city",
    "concepcion",
    "capas",
    "bamban",
    "la paz",
    "gerona",
  ],
  Zambales: [
    "zambales",
    "olongapo",
    "subic",
    "castillejos",
    "san marcelino",
    "san antonio",
    "san narciso",
  ],

  // Region IV-A - Calabarzon
  Cavite: [
    "cavite",
    "imus",
    "dasmariñas",
    "bacoor",
    "general trias",
    "trece martires",
    "tagaytay",
  ],
  Laguna: [
    "laguna",
    "san pablo",
    "santa rosa",
    "calamba",
    "biñan",
    "san pedro",
    "cabuyao",
  ],
  Batangas: [
    "batangas",
    "batangas city",
    "lipa",
    "tanauan",
    "santo tomas",
    "malvar",
    "nasugbu",
  ],
  Rizal: [
    "rizal",
    "antipolo",
    "cainta",
    "taytay",
    "angono",
    "binangonan",
    "cardona",
  ],
  Quezon: [
    "quezon",
    "lucena",
    "tayabas",
    "sariaya",
    "candelaria",
    "lucban",
    "gumaca",
  ],

  // Region IV-B - Mimaropa
  Marinduque: [
    "marinduque",
    "boac",
    "gasan",
    "mogpog",
    "santa cruz",
    "torrijos",
    "buenavista",
  ],
  "Occidental Mindoro": [
    "occidental mindoro",
    "san jose",
    "mamburao",
    "sablayan",
    "calintaan",
    "rizal",
    "looc",
  ],
  "Oriental Mindoro": [
    "oriental mindoro",
    "calapan",
    "roxas",
    "puerto galera",
    "bongabong",
    "bulalacao",
    "mansalay",
  ],
  Palawan: [
    "palawan",
    "puerto princesa",
    "el nido",
    "coron",
    "roxas",
    "taytay",
    "narra",
  ],
  Romblon: [
    "romblon",
    "romblon",
    "odiongan",
    "san agustin",
    "san andres",
    "san fernando",
    "santa fe",
  ],

  // Region V - Bicol Region
  Albay: [
    "albay",
    "legazpi",
    "ligao",
    "tabaco",
    "daraga",
    "camalig",
    "polangui",
  ],
  "Camarines Norte": [
    "camarines norte",
    "daet",
    "jose panganiban",
    "labo",
    "paracale",
    "san lorenzo ruiz",
    "san vicente",
  ],
  "Camarines Sur": [
    "camarines sur",
    "naga",
    "iriga",
    "libmanan",
    "sipocot",
    "calabanga",
    "pili",
  ],
  Catanduanes: [
    "catanduanes",
    "virac",
    "san andres",
    "caramoran",
    "pandan",
    "bagamanoc",
    "gigmoto",
  ],
  Masbate: [
    "masbate",
    "masbate city",
    "mobo",
    "uson",
    "cataingan",
    "milagros",
    "aroroy",
  ],
  Sorsogon: [
    "sorsogon",
    "sorsogon city",
    "bulan",
    "castilla",
    "donsol",
    "gubat",
    "irosin",
  ],

  // Cordillera Administrative Region (CAR)
  Abra: [
    "abra",
    "bangued",
    "lagangilang",
    "la paz",
    "san quintin",
    "tayum",
    "villaviciosa",
  ],
  Apayao: [
    "apayao",
    "kabugao",
    "conner",
    "flora",
    "luna",
    "pudtol",
    "santa marcela",
  ],
  Benguet: [
    "benguet",
    "baguio",
    "la trinidad",
    "itogon",
    "tuba",
    "sablan",
    "kapangan",
  ],
  Ifugao: [
    "ifugao",
    "lagawe",
    "kiangan",
    "alfonso lista",
    "mayoyao",
    "tinoc",
    "asipulo",
  ],
  Kalinga: [
    "kalinga",
    "tabuk",
    "balbalan",
    "lubuagan",
    "pasil",
    "tinglayan",
    "tanudan",
  ],
  "Mountain Province": [
    "mountain province",
    "mt. province",
    "bontoc",
    "sadanga",
    "barlig",
    "bauko",
    "besao",
    "natonin",
    "paracelis",
    "sagada",
    "tadian",
  ],
};

// Flattened list of all Luzon location keywords for easy searching
export const luzonKeywords = Object.values(luzonLocations).flat();

// Function to categorize address into Luzon provinces/cities
export const categorizeLuzonLocation = (address) => {
  if (!address || typeof address !== "string") {
    return "Not Specified";
  }

  const addressLower = address.toLowerCase().trim();

  // Check each province/city mapping
  for (const [province, keywords] of Object.entries(luzonLocations)) {
    for (const keyword of keywords) {
      if (addressLower.includes(keyword)) {
        return province;
      }
    }
  }

  // If no match found, check if it contains any Luzon-related terms
  if (
    addressLower.includes("luzon") ||
    addressLower.includes("metro manila") ||
    addressLower.includes("ncr")
  ) {
    return "Metro Manila";
  }

  return "Other Locations";
};
