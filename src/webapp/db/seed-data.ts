/**
 * Reference data seeded for development and first deploys.
 * Courts are public facts. All people, firms and posts in DEMO_* are made-up samples
 * (no real personal data in fixtures, rules/git.md).
 */

export const STATES = [
  { code: "kl", name: "Kerala", local: "കേരളം" },
  { code: "dl", name: "Delhi", local: null },
  { code: "tn", name: "Tamil Nadu", local: null },
  { code: "ka", name: "Karnataka", local: null },
  { code: "mh", name: "Maharashtra", local: null },
];

export const DISTRICTS: { code: string; name: string; local: string | null; state: string; lat: number; lng: number }[] = [
  { code: "tvm", name: "Thiruvananthapuram", local: "തിരുവനന്തപുരം", state: "kl", lat: 8.5241, lng: 76.9366 },
  { code: "kol", name: "Kollam", local: "കൊല്ലം", state: "kl", lat: 8.8932, lng: 76.6141 },
  { code: "pta", name: "Pathanamthitta", local: "പത്തനംതിട്ട", state: "kl", lat: 9.2648, lng: 76.787 },
  { code: "alp", name: "Alappuzha", local: "ആലപ്പുഴ", state: "kl", lat: 9.4981, lng: 76.3388 },
  { code: "ktm", name: "Kottayam", local: "കോട്ടയം", state: "kl", lat: 9.5916, lng: 76.5222 },
  { code: "idk", name: "Idukki", local: "ഇടുക്കി", state: "kl", lat: 9.8494, lng: 76.9719 },
  { code: "ekm", name: "Ernakulam", local: "എറണാകുളം", state: "kl", lat: 9.9816, lng: 76.2999 },
  { code: "tcr", name: "Thrissur", local: "തൃശ്ശൂർ", state: "kl", lat: 10.5276, lng: 76.2144 },
  { code: "pkd", name: "Palakkad", local: "പാലക്കാട്", state: "kl", lat: 10.7867, lng: 76.6548 },
  { code: "mlp", name: "Malappuram", local: "മലപ്പുറം", state: "kl", lat: 11.051, lng: 76.0711 },
  { code: "kzk", name: "Kozhikode", local: "കോഴിക്കോട്", state: "kl", lat: 11.2588, lng: 75.7804 },
  { code: "wyd", name: "Wayanad", local: "വയനാട്", state: "kl", lat: 11.6854, lng: 76.132 },
  { code: "knr", name: "Kannur", local: "കണ്ണൂർ", state: "kl", lat: 11.8745, lng: 75.3704 },
  { code: "ksd", name: "Kasaragod", local: "കാസർഗോഡ്", state: "kl", lat: 12.4996, lng: 74.9869 },
  { code: "del", name: "New Delhi", local: null, state: "dl", lat: 28.6139, lng: 77.209 },
  { code: "chn", name: "Chennai", local: null, state: "tn", lat: 13.0827, lng: 80.2707 },
  { code: "blr", name: "Bengaluru", local: null, state: "ka", lat: 12.9716, lng: 77.5946 },
  { code: "mum", name: "Mumbai", local: null, state: "mh", lat: 19.076, lng: 72.8777 },
];

/** Areas under a district (level "city" or "locality"), used by location pages and office addresses. */
export const AREAS: { code: string; name: string; local: string | null; district: string; lat: number; lng: number }[] = [
  { code: "kochi", name: "Kochi", local: "കൊച്ചി", district: "ekm", lat: 9.9312, lng: 76.2673 },
  { code: "aluva", name: "Aluva", local: "ആലുവ", district: "ekm", lat: 10.1004, lng: 76.3570 },
  { code: "pbvr", name: "Perumbavoor", local: "പെരുമ്പാവൂർ", district: "ekm", lat: 10.1126, lng: 76.4775 },
  { code: "kakn", name: "Kakkanad", local: "കാക്കനാട്", district: "ekm", lat: 10.0159, lng: 76.3419 },
  { code: "tvmc", name: "Thiruvananthapuram City", local: "തിരുവനന്തപുരം സിറ്റി", district: "tvm", lat: 8.5241, lng: 76.9366 },
  { code: "ptm", name: "Pattom", local: "പട്ടം", district: "tvm", lat: 8.5186, lng: 76.9442 },
  { code: "kzkc", name: "Kozhikode City", local: "കോഴിക്കോട് സിറ്റി", district: "kzk", lat: 11.2588, lng: 75.7804 },
  { code: "tcrc", name: "Thrissur City", local: "തൃശ്ശൂർ സിറ്റി", district: "tcr", lat: 10.5276, lng: 76.2144 },
];

export const CATEGORIES: { code: string; slug: string; name: string; ml: string }[] = [
  { code: "fam", slug: "family-law", name: "Family law", ml: "കുടുംബ നിയമം" },
  { code: "cri", slug: "criminal-law", name: "Criminal law", ml: "ക്രിമിനൽ നിയമം" },
  { code: "civ", slug: "civil-litigation", name: "Civil litigation", ml: "സിവിൽ വ്യവഹാരം" },
  { code: "prp", slug: "property-and-land", name: "Property and land", ml: "സ്വത്തും ഭൂമിയും" },
  { code: "cor", slug: "corporate-and-commercial", name: "Corporate and commercial", ml: "കോർപ്പറേറ്റ്, വാണിജ്യ നിയമം" },
  { code: "lab", slug: "labour-and-service", name: "Labour and service", ml: "തൊഴിൽ, സേവന നിയമം" },
  { code: "tax", slug: "taxation", name: "Taxation", ml: "നികുതി നിയമം" },
  { code: "ipr", slug: "intellectual-property", name: "Intellectual property", ml: "ബൗദ്ധിക സ്വത്തവകാശം" },
  { code: "con", slug: "consumer-protection", name: "Consumer protection", ml: "ഉപഭോക്തൃ സംരക്ഷണം" },
  { code: "wri", slug: "constitutional-and-writ", name: "Constitutional and writ", ml: "ഭരണഘടനാ, റിട്ട്" },
  { code: "arb", slug: "arbitration-and-mediation", name: "Arbitration and mediation", ml: "മധ്യസ്ഥത" },
  { code: "ban", slug: "banking-and-finance", name: "Banking and finance", ml: "ബാങ്കിങ്, ധനകാര്യം" },
  { code: "mac", slug: "motor-accident-claims", name: "Motor accident claims", ml: "മോട്ടോർ അപകട ക്ലെയിം" },
  { code: "env", slug: "environmental-law", name: "Environmental law", ml: "പരിസ്ഥിതി നിയമം" },
  { code: "nia", slug: "cheque-dishonour", name: "Cheque dishonour", ml: "ചെക്ക് കേസുകൾ" },
];

/** Court CSV in the admin import format (rules: MVP1-INSTRUCTIONS 1.3). */
export const COURT_CSV = `id,name,local_name,kind,state,district_code,city,locality,address,pincode,latitude,longitude
KL-HC-001,High Court of Kerala,കേരള ഹൈക്കോടതി,High Court,Kerala,ekm,Kochi,Kochi,"High Court of Kerala, Ernakulam",682031,9.9816,76.2755
KL-DC-EKM,Principal District and Sessions Court Ernakulam,എറണാകുളം ജില്ലാ കോടതി,District Court,Kerala,ekm,Kochi,Kochi,"District Court Complex, Ernakulam",682011,9.9857,76.2860
KL-FC-EKM,Family Court Ernakulam,എറണാകുളം കുടുംബ കോടതി,Family Court,Kerala,ekm,Kochi,Kochi,"Family Court Complex, Ernakulam",682011,9.9850,76.2858
KL-CC-EKM,Commercial Court Ernakulam,,Commercial Court,Kerala,ekm,Kochi,Kochi,"Court Complex, Ernakulam",682011,9.9855,76.2862
KL-MC-ALV,Munsiff Magistrate Court Aluva,ആലുവ മുൻസിഫ് കോടതി,Magistrate Court,Kerala,ekm,Aluva,Aluva,"Court Road, Aluva",683101,10.1018,76.3562
KL-DC-TVM,District and Sessions Court Thiruvananthapuram,തിരുവനന്തപുരം ജില്ലാ കോടതി,District Court,Kerala,tvm,Thiruvananthapuram City,Thiruvananthapuram City,"Court Complex, Vanchiyoor",695035,8.4893,76.9456
KL-FC-TVM,Family Court Thiruvananthapuram,തിരുവനന്തപുരം കുടുംബ കോടതി,Family Court,Kerala,tvm,Thiruvananthapuram City,Pattom,"Family Court, Thiruvananthapuram",695004,8.5231,76.9460
KL-DC-KZK,District and Sessions Court Kozhikode,കോഴിക്കോട് ജില്ലാ കോടതി,District Court,Kerala,kzk,Kozhikode City,Kozhikode City,"Court Complex, Kozhikode",673032,11.2494,75.7802
KL-DC-TCR,District and Sessions Court Thrissur,തൃശ്ശൂർ ജില്ലാ കോടതി,District Court,Kerala,tcr,Thrissur City,Thrissur City,"Court Complex, Ramavarmapuram",680631,10.5470,76.2160
KL-DC-KTM,District and Sessions Court Kottayam,കോട്ടയം ജില്ലാ കോടതി,District Court,Kerala,ktm,Kottayam,Kottayam,"Court Complex, Kottayam",686001,9.5916,76.5222
IN-SC-001,Supreme Court of India,,Supreme Court,Delhi,del,New Delhi,New Delhi,"Tilak Marg, New Delhi",110001,28.6227,77.2410
IN-HC-DL,High Court of Delhi,,High Court,Delhi,del,New Delhi,New Delhi,"Sher Shah Road, New Delhi",110003,28.6180,77.2400
TN-HC-001,Madras High Court,,High Court,Tamil Nadu,chn,Chennai,Chennai,"High Court Campus, Chennai",600104,13.0878,80.2870
KA-HC-001,High Court of Karnataka,,High Court,Karnataka,blr,Bengaluru,Bengaluru,"Dr Ambedkar Veedhi, Bengaluru",560001,12.9783,77.5920
MH-HC-001,Bombay High Court,,High Court,Maharashtra,mum,Mumbai,Mumbai,"Fort, Mumbai",400032,18.9280,72.8319
`;

export const COURT_DETAILS: Record<string, { key: string; value: string }[]> = {
  "KL-HC-001": [
    { key: "Registry", value: "Open on working days, 10:15 am to 5 pm" },
    { key: "Jurisdiction", value: "State of Kerala and the Union Territory of Lakshadweep" },
  ],
  "KL-FC-EKM": [{ key: "Matters heard", value: "Divorce, maintenance, custody and guardianship" }],
};

/* ----------------------------------------------------------- demo content */

export interface DemoPage {
  mobile: string;
  type: "advocate" | "firm";
  name: string;
  slug: string;
  district: string;
  plan: "basic" | "professional" | "premium";
  enrolmentNo?: string;
  yearEnrolled?: number;
  establishedYear?: number;
  bio: string;
  about?: string;
  categories: string[]; // codes
  courts: string[]; // import keys
  languages: string[];
  career?: { yearFrom: number; yearTo: number | null; title: string; institution: string }[];
  cases?: { court: string; role: string; year: number; outcome: string; note?: string }[];
  highlights?: { number: number; label: string }[];
  offices?: { name: string; address: string; area: string; about: string; lat: number; lng: number; courts?: string[] }[];
}

export const DEMO_PAGES: DemoPage[] = [
  {
    mobile: "+919000000001", type: "advocate", name: "Asha Menon", slug: "asha-menon", district: "ekm", plan: "professional",
    enrolmentNo: "K/1234/2010", yearEnrolled: 2010,
    bio: "Practises family and matrimonial law in Kochi. B.A. LL.B., Bar Council of Kerala.",
    about: "Appears in the Family Court Ernakulam and the High Court of Kerala on divorce, maintenance, custody and succession matters.",
    categories: ["fam", "civ"], courts: ["KL-FC-EKM", "KL-HC-001"], languages: ["en", "ml"],
    career: [
      { yearFrom: 2015, yearTo: null, title: "Advocate", institution: "Chambers, Kochi" },
      { yearFrom: 2010, yearTo: 2015, title: "Junior advocate", institution: "Chambers, Ernakulam" },
    ],
    cases: [{ court: "KL-FC-EKM", role: "Appeared for the petitioner", year: 2023, outcome: "petition_allowed", note: "Divorce petition by mutual consent" }],
    highlights: [{ number: 15, label: "Years in practice" }, { number: 3, label: "Languages" }],
    offices: [{ name: "Kochi chamber", address: "Court Road, Ernakulam", area: "kochi", about: "Chamber near the Family Court. Open on weekdays.", lat: 9.9857, lng: 76.2858, courts: ["KL-FC-EKM"] }],
  },
  {
    mobile: "+919000000002", type: "advocate", name: "Rahul Nair", slug: "rahul-nair-adv", district: "ekm", plan: "premium",
    enrolmentNo: "K/2201/2012", yearEnrolled: 2012,
    bio: "Practises criminal and constitutional law. LL.B., LL.M. Appears in the High Court of Kerala.",
    categories: ["cri", "wri"], courts: ["KL-HC-001", "KL-DC-EKM"], languages: ["en", "ml", "hi"],
    highlights: [{ number: 13, label: "Years in practice" }],
  },
  {
    mobile: "+919000000003", type: "advocate", name: "Sneha Pillai", slug: "sneha-pillai", district: "ekm", plan: "basic",
    enrolmentNo: "K/3310/2018", yearEnrolled: 2018,
    bio: "Practises property and land matters. Based in Aluva.",
    categories: ["prp", "civ"], courts: ["KL-MC-ALV", "KL-DC-EKM"], languages: ["en", "ml"],
  },
  {
    mobile: "+919000000004", type: "advocate", name: "Joseph Mathew", slug: "joseph-mathew", district: "ekm", plan: "basic",
    enrolmentNo: "K/4120/2005", yearEnrolled: 2005,
    bio: "Practises motor accident claims and consumer matters in Ernakulam.",
    categories: ["mac", "con"], courts: ["KL-DC-EKM"], languages: ["en", "ml"],
  },
  {
    mobile: "+919000000005", type: "advocate", name: "Fathima Rahman", slug: "fathima-rahman", district: "kzk", plan: "professional",
    enrolmentNo: "K/5002/2014", yearEnrolled: 2014,
    bio: "Practises family and succession law in Kozhikode.",
    categories: ["fam", "prp"], courts: ["KL-DC-KZK"], languages: ["en", "ml"],
    highlights: [{ number: 11, label: "Years in practice" }],
  },
  {
    mobile: "+919000000006", type: "advocate", name: "Anand Krishnan", slug: "anand-krishnan", district: "tvm", plan: "basic",
    enrolmentNo: "K/6003/2009", yearEnrolled: 2009,
    bio: "Practises taxation and corporate matters in Thiruvananthapuram.",
    categories: ["tax", "cor"], courts: ["KL-DC-TVM", "KL-HC-001"], languages: ["en", "ml"],
  },
  {
    mobile: "+919000000007", type: "advocate", name: "Maya Varghese", slug: "maya-varghese", district: "tvm", plan: "basic",
    enrolmentNo: "K/7011/2016", yearEnrolled: 2016,
    bio: "Practises labour and service law. B.A. LL.B.",
    categories: ["lab"], courts: ["KL-DC-TVM"], languages: ["en", "ml"],
  },
  {
    mobile: "+919000000008", type: "advocate", name: "Vishnu Prasad", slug: "vishnu-prasad", district: "tcr", plan: "basic",
    enrolmentNo: "K/8120/2019", yearEnrolled: 2019,
    bio: "Practises cheque dishonour and banking matters in Thrissur.",
    categories: ["nia", "ban"], courts: ["KL-DC-TCR"], languages: ["en", "ml"],
  },
  {
    mobile: "+919000000010", type: "firm", name: "Menon and Associates", slug: "menon-associates", district: "ekm", plan: "premium",
    establishedYear: 2008,
    bio: "Law firm in Kochi working on corporate, commercial and arbitration matters.",
    about: "Established in 2008 with offices in Kochi and Thiruvananthapuram.",
    categories: ["cor", "arb", "ban"], courts: ["KL-HC-001", "KL-CC-EKM"], languages: ["en", "ml"],
    highlights: [{ number: 2, label: "Offices" }, { number: 17, label: "Years established" }],
    offices: [
      { name: "Kochi office", address: "MG Road, Ernakulam", area: "kochi", about: "Main office. Corporate and commercial matters before the High Court and the Commercial Court.", lat: 9.9696, lng: 76.2905, courts: ["KL-HC-001", "KL-CC-EKM"] },
      { name: "Thiruvananthapuram office", address: "Pattom, Thiruvananthapuram", area: "ptm", about: "Branch office handling matters in the district courts of Thiruvananthapuram.", lat: 8.5186, lng: 76.9442, courts: ["KL-DC-TVM"] },
    ],
  },
  {
    mobile: "+919000000011", type: "firm", name: "Kerala Legal Chambers", slug: "kerala-legal-chambers", district: "kzk", plan: "basic",
    establishedYear: 2016,
    bio: "Law firm in Kozhikode working on civil and property matters.",
    categories: ["civ", "prp"], courts: ["KL-DC-KZK"], languages: ["en", "ml"],
  },
  {
    mobile: "+919000000012", type: "firm", name: "Thrissur Law Offices", slug: "thrissur-law-offices", district: "tcr", plan: "professional",
    establishedYear: 2012,
    bio: "Law firm in Thrissur working on cheque dishonour, banking and civil matters.",
    categories: ["nia", "ban", "civ"], courts: ["KL-DC-TCR"], languages: ["en", "ml"],
    highlights: [{ number: 13, label: "Years established" }],
    offices: [{ name: "Thrissur office", address: "Round South, Thrissur", area: "tcrc", about: "Main office near the District Court.", lat: 10.5240, lng: 76.2139 }],
  },
];

export const DEMO_POSTS: { page: string; title: string; body: string; categories: string[]; court?: string }[] = [
  {
    page: "asha-menon",
    title: "How maintenance is decided in Family Courts",
    body: "Maintenance orders under Section 125 of the Code of Criminal Procedure and under personal laws depend on the means of both parties and the needs of the person claiming it. This note explains the factors courts commonly consider and the documents usually filed.",
    categories: ["fam"], court: "KL-FC-EKM",
  },
  {
    page: "rahul-nair-adv",
    title: "Bail applications: what the High Court looks at",
    body: "A regular bail application before the High Court is considered on the nature of the accusation, the stage of the case and the conduct of the applicant. This article summarises the usual grounds and the documents that accompany an application.",
    categories: ["cri"], court: "KL-HC-001",
  },
  {
    page: "menon-associates",
    title: "Commercial Courts Act: pre-institution mediation",
    body: "Section 12A of the Commercial Courts Act, 2015 requires pre-institution mediation for suits that do not seek urgent interim relief. This note outlines the steps and the timelines.",
    categories: ["cor", "arb"], court: "KL-CC-EKM",
  },
];

export const DEMO_UPDATES: { title: string; body: string; court: string; source: string; page?: string }[] = [
  {
    title: "Registry timings notified for the vacation period",
    body: "The registry has notified revised timings for filing during the vacation period. Advocates may check the notice on the court website before filing.",
    court: "KL-HC-001", source: "https://example.org/notice/registry-timings",
  },
  {
    title: "New e-filing counter opened at the Family Court",
    body: "A new e-filing help counter has been opened at the Family Court complex for petitions and documents.",
    court: "KL-FC-EKM", source: "https://example.org/notice/e-filing-counter", page: "asha-menon",
  },
];
