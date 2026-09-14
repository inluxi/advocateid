import "dotenv/config";
import { PrismaClient, LocationType, InstitutionType, OutcomeTag } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
}
const db = new PrismaClient({ adapter: new PrismaMariaDb(url) });

function placeholderPhoto(slug: string) {
  // 4:5 portrait ratio per the design system's binding image spec.
  return `https://picsum.photos/seed/${slug}/400/500`;
}

async function main() {
  console.log("Resetting seed tables...");
  // Delete in FK-safe order (children before parents).
  await db.review.deleteMany();
  await db.caseSummary.deleteMany();
  await db.post.deleteMany();
  await db.profileInstitution.deleteMany();
  await db.office.deleteMany();
  await db.profileCategory.deleteMany();
  await db.profile.deleteMany();
  await db.institution.deleteMany();
  await db.category.deleteMany();
  await db.vertical.deleteMany();
  await db.locality.deleteMany();

  console.log("Seeding localities...");
  const kerala = await db.locality.create({
    data: {
      name: "Kerala",
      localName: "കേരളം",
      latitude: 10.8505,
      longitude: 76.2711,
      locationType: LocationType.state,
      slug: "kerala",
    },
  });

  const ernakulam = await db.locality.create({
    data: {
      name: "Ernakulam",
      localName: "എറണാകുളം",
      latitude: 10.0,
      longitude: 76.3,
      locationType: LocationType.district,
      slug: "ernakulam",
      parentId: kerala.id,
    },
  });
  const thiruvananthapuramDistrict = await db.locality.create({
    data: {
      name: "Thiruvananthapuram District",
      localName: "തിരുവനന്തപുരം ജില്ല",
      latitude: 8.5241,
      longitude: 76.9366,
      locationType: LocationType.district,
      slug: "thiruvananthapuram-district",
      parentId: kerala.id,
    },
  });
  const kozhikodeDistrict = await db.locality.create({
    data: {
      name: "Kozhikode",
      localName: "കോഴിക്കോട്",
      latitude: 11.2588,
      longitude: 75.7804,
      locationType: LocationType.district,
      slug: "kozhikode-district",
      parentId: kerala.id,
    },
  });

  const kochi = await db.locality.create({
    data: {
      name: "Kochi",
      localName: "കൊച്ചി",
      latitude: 9.9312,
      longitude: 76.2673,
      locationType: LocationType.city,
      slug: "kochi",
      parentId: ernakulam.id,
    },
  });
  const thiruvananthapuram = await db.locality.create({
    data: {
      name: "Thiruvananthapuram",
      localName: "തിരുവനന്തപുരം",
      latitude: 8.5241,
      longitude: 76.9366,
      locationType: LocationType.city,
      slug: "thiruvananthapuram",
      parentId: thiruvananthapuramDistrict.id,
    },
  });
  const kozhikode = await db.locality.create({
    data: {
      name: "Kozhikode",
      localName: "കോഴിക്കോട്",
      latitude: 11.2588,
      longitude: 75.7804,
      locationType: LocationType.city,
      slug: "kozhikode",
      parentId: kozhikodeDistrict.id,
    },
  });

  const localityRows: Record<string, Awaited<ReturnType<typeof db.locality.create>>> = {};
  const localitySeeds: Array<{
    key: string;
    name: string;
    localName: string;
    lat: number;
    lng: number;
    parentId: number;
    slug: string;
  }> = [
    { key: "fort-kochi", name: "Fort Kochi", localName: "കൊച്ചി കോട്ട", lat: 9.9658, lng: 76.2427, parentId: kochi.id, slug: "fort-kochi" },
    { key: "kakkanad", name: "Kakkanad", localName: "കാക്കനാട്", lat: 10.0159, lng: 76.3419, parentId: kochi.id, slug: "kakkanad" },
    { key: "edapally", name: "Edapally", localName: "ഇടപ്പള്ളി", lat: 10.0261, lng: 76.3086, parentId: kochi.id, slug: "edapally" },
    { key: "kowdiar", name: "Kowdiar", localName: "കവടിയാർ", lat: 8.5167, lng: 76.95, parentId: thiruvananthapuram.id, slug: "kowdiar" },
    { key: "vazhuthacaud", name: "Vazhuthacaud", localName: "വഴുതക്കാട്", lat: 8.506, lng: 76.95, parentId: thiruvananthapuram.id, slug: "vazhuthacaud" },
    { key: "pattom", name: "Pattom", localName: "പട്ടം", lat: 8.5182, lng: 76.945, parentId: thiruvananthapuram.id, slug: "pattom" },
    { key: "mananchira", name: "Mananchira", localName: "മാനാഞ്ചിറ", lat: 11.251, lng: 75.78, parentId: kozhikode.id, slug: "mananchira" },
    { key: "west-hill", name: "West Hill", localName: "വെസ്റ്റ് ഹിൽ", lat: 11.275, lng: 75.77, parentId: kozhikode.id, slug: "west-hill" },
    { key: "palayam-kzd", name: "Palayam", localName: "പാളയം", lat: 11.245, lng: 75.775, parentId: kozhikode.id, slug: "palayam-kzd" },
  ];
  for (const l of localitySeeds) {
    localityRows[l.key] = await db.locality.create({
      data: {
        name: l.name,
        localName: l.localName,
        latitude: l.lat,
        longitude: l.lng,
        locationType: LocationType.locality,
        slug: l.slug,
        parentId: l.parentId,
      },
    });
  }

  console.log("Seeding vertical + categories...");
  const lawyer = await db.vertical.create({ data: { name: "Lawyer", slug: "lawyer" } });

  const categoryDefs = [
    { name: "Property Law", slug: "property-law" },
    { name: "Criminal Law", slug: "criminal-law" },
    { name: "Family Law", slug: "family-law" },
    { name: "Corporate Law", slug: "corporate-law" },
    { name: "Tax Law", slug: "tax-law" },
    { name: "Civil Litigation", slug: "civil-litigation" },
  ];
  const categories: Record<string, Awaited<ReturnType<typeof db.category.create>>> = {};
  for (const c of categoryDefs) {
    categories[c.slug] = await db.category.create({
      data: { name: c.name, slug: c.slug, verticalId: lawyer.id },
    });
  }

  console.log("Seeding institutions...");
  const institutionDefs = [
    {
      name: "Kerala High Court",
      slug: "kerala-high-court",
      type: InstitutionType.court,
      locality: kochi,
      lat: 9.9816,
      lng: 76.2999,
      description:
        "The High Court of Kerala, seated in Ernakulam, is the principal civil court of original jurisdiction for the state and hears appeals from district and subordinate courts.",
    },
    {
      name: "Ernakulam District Court",
      slug: "ernakulam-district-court",
      type: InstitutionType.court,
      locality: kochi,
      lat: 9.9847,
      lng: 76.2853,
      description:
        "The principal district and sessions court for Ernakulam district, hearing civil and criminal matters at first instance.",
    },
    {
      name: "Family Court, Ernakulam",
      slug: "family-court-ernakulam",
      type: InstitutionType.court,
      locality: kochi,
      lat: 9.9833,
      lng: 76.2999,
      description:
        "A specialised court dealing exclusively with matrimonial, custody, and maintenance disputes in Ernakulam district.",
    },
    {
      name: "Thiruvananthapuram District Court",
      slug: "thiruvananthapuram-district-court",
      type: InstitutionType.court,
      locality: thiruvananthapuram,
      lat: 8.4875,
      lng: 76.9525,
      description:
        "The principal district and sessions court for Thiruvananthapuram district.",
    },
    {
      name: "Kerala State Consumer Disputes Redressal Commission",
      slug: "kerala-state-consumer-commission",
      type: InstitutionType.tribunal,
      locality: thiruvananthapuram,
      lat: 8.5074,
      lng: 76.9563,
      description:
        "The state-level appellate tribunal for consumer protection disputes in Kerala.",
    },
    {
      name: "Kozhikode District Court",
      slug: "kozhikode-district-court",
      type: InstitutionType.court,
      locality: kozhikode,
      lat: 11.2495,
      lng: 75.7772,
      description:
        "The principal district and sessions court for Kozhikode district.",
    },
  ];
  const institutions: Record<string, Awaited<ReturnType<typeof db.institution.create>>> = {};
  for (const i of institutionDefs) {
    institutions[i.slug] = await db.institution.create({
      data: {
        name: i.name,
        slug: i.slug,
        type: i.type,
        localityId: i.locality.id,
        latitude: i.lat,
        longitude: i.lng,
        description: i.description,
      },
    });
  }

  console.log("Seeding profiles...");
  type ProfileSeed = {
    name: string;
    slug: string;
    profileType: "free" | "professional";
    tagline: string;
    bio: string;
    whatsapp: string;
    contactHours: string;
    city: typeof kochi;
    locality: (typeof localityRows)[string];
    categorySlugs: string[];
    institutionSlugs: string[];
    offices: Array<{ name: string; address: string; locality: (typeof localityRows)[string]; lat: number; lng: number; isPrimary: boolean }>;
    posts: Array<{ title: string; slug: string; excerpt: string; body: string; daysAgo: number }>;
    caseSummaries: Array<{ title: string; outcome: OutcomeTag; summary: string; referenceLink?: string }>;
    reviews: Array<{ reviewerName: string; rating: number; comment: string; daysAgo: number }>;
  };

  const days = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  const profileSeeds: ProfileSeed[] = [
    {
      name: "Arjun Menon",
      slug: "arjun-menon",
      profileType: "professional",
      tagline: "Property and land title disputes across Ernakulam district",
      bio: "Arjun Menon has practised property and real estate law in Ernakulam for over 14 years, with a focus on title verification, land acquisition compensation, and partition suits. He has appeared before the Kerala High Court and the Ernakulam District Court in over 200 matters.",
      whatsapp: "+919847012345",
      contactHours: "Mon–Sat, 10:00 AM – 6:00 PM",
      city: kochi,
      locality: localityRows["edapally"],
      categorySlugs: ["property-law", "civil-litigation"],
      institutionSlugs: ["kerala-high-court", "ernakulam-district-court"],
      offices: [
        { name: "Menon & Associates", address: "2nd Floor, Marine Chambers, MG Road, Edapally", locality: localityRows["edapally"], lat: 10.0261, lng: 76.3086, isPrimary: true },
      ],
      posts: [
        {
          title: "What to Check Before Buying Resale Property in Kochi",
          slug: "buying-resale-property-kochi-checklist",
          excerpt: "A practical checklist for title verification before a resale property purchase.",
          body: "Before buying resale property in Kochi, buyers should verify the encumbrance certificate for at least 30 years, confirm the seller's title chain, check for pending partition or mortgage disputes, and obtain a possession certificate from the local body. This article walks through each step and common pitfalls I have seen in over a decade of practice.",
          daysAgo: 40,
        },
        {
          title: "Understanding Land Acquisition Compensation Under the 2013 Act",
          slug: "land-acquisition-compensation-2013-act",
          excerpt: "How compensation is calculated when the state acquires private land.",
          body: "The Right to Fair Compensation and Transparency in Land Acquisition Act, 2013 introduced a multiplier-based compensation formula that varies between rural and urban areas. This post explains how affected landowners in Ernakulam district can compute expected compensation and file objections during the award stage.",
          daysAgo: 15,
        },
      ],
      caseSummaries: [
        {
          title: "Partition suit resolved in favour of client's inherited share",
          outcome: OutcomeTag.favorable,
          summary: "Represented a client seeking their rightful share in ancestral property against co-owners disputing the partition. The Ernakulam District Court upheld the client's claim to a one-third share.",
        },
        {
          title: "Title dispute over reclaimed backwater land",
          outcome: OutcomeTag.settled,
          summary: "Negotiated a settlement between two adjoining landowners over a boundary dispute involving reclaimed land near Vembanad backwaters, avoiding prolonged litigation.",
        },
      ],
      reviews: [
        { reviewerName: "Thomas Jacob", rating: 5, comment: "Extremely thorough with title verification, saved us from a bad purchase.", daysAgo: 20 },
        { reviewerName: "Sunitha Rajan", rating: 5, comment: "Handled our partition case patiently over two years and got a fair outcome.", daysAgo: 55 },
        { reviewerName: "Biju Varghese", rating: 4, comment: "Knowledgeable, though response times over WhatsApp could be quicker.", daysAgo: 90 },
      ],
    },
    {
      name: "Priya Nair",
      slug: "priya-nair",
      profileType: "free",
      tagline: "Family law and mutual consent divorce in Kochi",
      bio: "Priya Nair is a family law advocate based in Fort Kochi, handling divorce, child custody, and maintenance matters before the Family Court, Ernakulam. She is known for a mediation-first approach that keeps contested matters out of prolonged litigation where possible.",
      whatsapp: "+919847023456",
      contactHours: "Mon–Fri, 11:00 AM – 5:00 PM",
      city: kochi,
      locality: localityRows["fort-kochi"],
      categorySlugs: ["family-law"],
      institutionSlugs: ["family-court-ernakulam"],
      offices: [
        { name: "Priya Nair Law Chambers", address: "Near Parade Ground, Fort Kochi", locality: localityRows["fort-kochi"], lat: 9.9658, lng: 76.2427, isPrimary: true },
      ],
      posts: [
        {
          title: "Mutual Consent Divorce in Kerala: Timeline and Documents",
          slug: "mutual-consent-divorce-kerala-timeline",
          excerpt: "What to expect when both spouses agree to separate.",
          body: "A mutual consent divorce under Section 13B of the Hindu Marriage Act typically takes six to eighteen months in Kerala family courts, including the mandatory cooling-off period. This post lists the documents required and how the cooling-off period can be waived in limited circumstances.",
          daysAgo: 25,
        },
      ],
      caseSummaries: [
        {
          title: "Child custody arrangement finalised through mediation",
          outcome: OutcomeTag.settled,
          summary: "Facilitated a mediated custody and visitation schedule between separating parents, avoiding a contested custody trial.",
        },
      ],
      reviews: [
        { reviewerName: "Anu Mathew", rating: 5, comment: "Compassionate and clear about the process from day one.", daysAgo: 10 },
        { reviewerName: "Rajesh Pillai", rating: 4, comment: "Good advocate, court dates got pushed a couple of times but that wasn't her fault.", daysAgo: 60 },
        { reviewerName: "Deepa Krishnan", rating: 5, comment: "Helped us reach a mutual consent divorce quickly and fairly.", daysAgo: 100 },
      ],
    },
    {
      name: "Rahul Varma",
      slug: "rahul-varma",
      profileType: "professional",
      tagline: "Corporate structuring and tax advisory for growing businesses",
      bio: "Rahul Varma advises startups and mid-sized companies in Kerala on incorporation, contract drafting, and tax compliance. Over 10 years he has worked with over 80 companies on structuring, GST disputes, and commercial contract negotiation.",
      whatsapp: "+919847034567",
      contactHours: "Mon–Sat, 9:30 AM – 7:00 PM",
      city: kochi,
      locality: localityRows["kakkanad"],
      categorySlugs: ["corporate-law", "tax-law"],
      institutionSlugs: ["kerala-high-court"],
      offices: [
        { name: "Varma Legal & Tax", address: "InfoPark Phase 1, Kakkanad", locality: localityRows["kakkanad"], lat: 10.0159, lng: 76.3419, isPrimary: true },
        { name: "Varma Legal & Tax — Edapally Annex", address: "NH Bypass, Edapally", locality: localityRows["edapally"], lat: 10.0261, lng: 76.3086, isPrimary: false },
      ],
      posts: [
        {
          title: "Choosing Between a Private Limited Company and an LLP in Kerala",
          slug: "private-limited-vs-llp-kerala",
          excerpt: "A founder's guide to the two most common structures.",
          body: "Founders in Kerala's startup ecosystem often ask whether to incorporate as a private limited company or an LLP. This post compares compliance cost, fundraising suitability, and tax treatment under both structures, drawing on incorporation work with over 80 companies.",
          daysAgo: 30,
        },
        {
          title: "GST Notices: How to Respond Within the Deadline",
          slug: "gst-notices-response-deadline",
          excerpt: "A step-by-step approach to scrutiny and demand notices.",
          body: "Receiving a GST scrutiny or demand notice can be alarming, but most issues are resolvable if addressed within the statutory window. This post outlines how to triage a notice, gather supporting documents, and draft a reply that preserves your right to appeal.",
          daysAgo: 8,
        },
      ],
      caseSummaries: [
        {
          title: "GST demand set aside on procedural grounds",
          outcome: OutcomeTag.favorable,
          summary: "Successfully argued before the appellate authority that a GST demand notice was issued without proper service, resulting in the demand being set aside.",
        },
        {
          title: "Commercial contract breach claim",
          outcome: OutcomeTag.pending,
          summary: "Currently representing a manufacturing client in a breach of contract claim against a supplier, pending before the Kerala High Court.",
        },
      ],
      reviews: [
        { reviewerName: "Sandeep Menon", rating: 5, comment: "Structured our seed-stage incorporation cleanly and explained every clause.", daysAgo: 12 },
        { reviewerName: "Fathima Beevi", rating: 5, comment: "Resolved a messy GST notice for our small business quickly.", daysAgo: 45 },
        { reviewerName: "Nikhil Joseph", rating: 4, comment: "Solid advisor, slightly premium pricing but worth it.", daysAgo: 70 },
        { reviewerName: "Reshma Pillai", rating: 5, comment: "Best corporate lawyer we've worked with in Kochi.", daysAgo: 110 },
      ],
    },
    {
      name: "Anjali Pillai",
      slug: "anjali-pillai",
      profileType: "free",
      tagline: "Criminal defence advocate practising in Thiruvananthapuram",
      bio: "Anjali Pillai has defended clients in criminal trials before the Thiruvananthapuram District Court for eight years, with experience in bail applications, cheque bounce cases under Section 138, and cybercrime complaints.",
      whatsapp: "+919847045678",
      contactHours: "Mon–Sat, 10:00 AM – 6:00 PM",
      city: thiruvananthapuram,
      locality: localityRows["pattom"],
      categorySlugs: ["criminal-law"],
      institutionSlugs: ["thiruvananthapuram-district-court"],
      offices: [
        { name: "Pillai Criminal Law Chambers", address: "Near Pattom Junction, Thiruvananthapuram", locality: localityRows["pattom"], lat: 8.5182, lng: 76.945, isPrimary: true },
      ],
      posts: [
        {
          title: "Anticipatory Bail in Kerala: When and How to Apply",
          slug: "anticipatory-bail-kerala-guide",
          excerpt: "What the courts look for when granting anticipatory bail.",
          body: "Anticipatory bail applications in Kerala are typically filed before the Sessions Court or the High Court when a person has reasonable apprehension of arrest. This post explains the grounds courts weigh, including flight risk, cooperation with investigation, and gravity of the alleged offence.",
          daysAgo: 18,
        },
      ],
      caseSummaries: [
        {
          title: "Cheque bounce complaint under Section 138 resolved",
          outcome: OutcomeTag.settled,
          summary: "Negotiated a compounding settlement in a Section 138 cheque dishonour case, resulting in repayment and withdrawal of the complaint.",
        },
        {
          title: "Bail granted in a cybercrime investigation",
          outcome: OutcomeTag.favorable,
          summary: "Secured bail for a client accused in a cybercrime matter by demonstrating cooperation with the investigating officer and absence of flight risk.",
        },
      ],
      reviews: [
        { reviewerName: "Vipin Chandran", rating: 4, comment: "Got my anticipatory bail application filed quickly under pressure.", daysAgo: 22 },
        { reviewerName: "Sreelakshmi S", rating: 5, comment: "Very responsive and explained the process clearly at every stage.", daysAgo: 65 },
      ],
    },
    {
      name: "Suresh Kumar",
      slug: "suresh-kumar",
      profileType: "professional",
      tagline: "Property, tenancy, and land revenue disputes",
      bio: "Suresh Kumar has practised property and tenancy law in Thiruvananthapuram for over 18 years, regularly appearing before the District Court and Land Revenue authorities on encroachment, tenancy eviction, and boundary disputes.",
      whatsapp: "+919847056789",
      contactHours: "Mon–Sat, 9:00 AM – 6:30 PM",
      city: thiruvananthapuram,
      locality: localityRows["kowdiar"],
      categorySlugs: ["property-law"],
      institutionSlugs: ["thiruvananthapuram-district-court"],
      offices: [
        { name: "Suresh Kumar & Co.", address: "Kowdiar Road, Thiruvananthapuram", locality: localityRows["kowdiar"], lat: 8.5167, lng: 76.95, isPrimary: true },
      ],
      posts: [
        {
          title: "Tenant Eviction Grounds Under the Kerala Buildings Act",
          slug: "tenant-eviction-grounds-kerala-buildings-act",
          excerpt: "The limited grounds landlords can rely on to evict tenants.",
          body: "The Kerala Buildings (Lease and Rent Control) Act restricts landlords to specific grounds for eviction, including bona fide need, arrears of rent, and unauthorised subletting. This post walks through the eviction petition process before the Rent Control Court.",
          daysAgo: 33,
        },
        {
          title: "Resolving Boundary Disputes Without Litigation",
          slug: "resolving-boundary-disputes-without-litigation",
          excerpt: "When a joint survey can avoid years of court proceedings.",
          body: "Many boundary disputes in Thiruvananthapuram can be resolved through a joint survey conducted by the Village Officer or a licensed surveyor before matters escalate to litigation. This post explains when to request one and how to use the report in negotiations.",
          daysAgo: 5,
        },
      ],
      caseSummaries: [
        {
          title: "Eviction petition allowed on grounds of bona fide need",
          outcome: OutcomeTag.favorable,
          summary: "Represented a landlord seeking eviction for personal occupation; the Rent Control Court allowed the petition after establishing genuine need.",
        },
      ],
      reviews: [
        { reviewerName: "Manoj Nair", rating: 5, comment: "Handled our tenancy dispute professionally and won the case.", daysAgo: 40 },
        { reviewerName: "Latha Devi", rating: 5, comment: "Very experienced with land revenue matters, highly recommend.", daysAgo: 80 },
        { reviewerName: "George Mathew", rating: 4, comment: "Good outcome though the case took longer than initially expected.", daysAgo: 130 },
      ],
    },
    {
      name: "Divya Krishnan",
      slug: "divya-krishnan",
      profileType: "free",
      tagline: "Maintenance, custody, and domestic violence matters",
      bio: "Divya Krishnan represents women and families in maintenance, custody, and protection order matters in Thiruvananthapuram, with a focus on cases under the Protection of Women from Domestic Violence Act.",
      whatsapp: "+919847067890",
      contactHours: "Mon–Fri, 10:00 AM – 5:00 PM",
      city: thiruvananthapuram,
      locality: localityRows["vazhuthacaud"],
      categorySlugs: ["family-law", "civil-litigation"],
      institutionSlugs: ["thiruvananthapuram-district-court"],
      offices: [
        { name: "Divya Krishnan Advocate", address: "Vazhuthacaud, Thiruvananthapuram", locality: localityRows["vazhuthacaud"], lat: 8.506, lng: 76.95, isPrimary: true },
      ],
      posts: [
        {
          title: "Filing for Maintenance Under Section 125 CrPC",
          slug: "filing-maintenance-section-125-crpc",
          excerpt: "Who can claim maintenance and how much courts typically award.",
          body: "Section 125 of the Code of Criminal Procedure allows a wife, children, or parents to claim maintenance from a person who neglects to maintain them. This post explains eligibility, the documents needed, and factors courts weigh when deciding the amount.",
          daysAgo: 20,
        },
      ],
      caseSummaries: [
        {
          title: "Protection order granted under the Domestic Violence Act",
          outcome: OutcomeTag.favorable,
          summary: "Obtained a protection order and interim maintenance for a client facing domestic abuse, within three weeks of filing.",
        },
      ],
      reviews: [
        { reviewerName: "Nimisha Raj", rating: 5, comment: "Made a very difficult time much easier to navigate.", daysAgo: 15 },
        { reviewerName: "Ajith Kumar", rating: 4, comment: "Professional and prompt with paperwork.", daysAgo: 50 },
        { reviewerName: "Sowmya Menon", rating: 5, comment: "Got my protection order sorted quickly, very grateful.", daysAgo: 95 },
      ],
    },
    {
      name: "Vishnu Nambiar",
      slug: "vishnu-nambiar",
      profileType: "professional",
      tagline: "Corporate contracts and commercial dispute resolution",
      bio: "Vishnu Nambiar advises manufacturing and trading businesses across Malabar on commercial contracts, dealership agreements, and arbitration. He has represented clients in over 50 arbitration and commercial suits before the Kozhikode District Court.",
      whatsapp: "+919847078901",
      contactHours: "Mon–Sat, 9:00 AM – 6:00 PM",
      city: kozhikode,
      locality: localityRows["mananchira"],
      categorySlugs: ["corporate-law", "civil-litigation"],
      institutionSlugs: ["kozhikode-district-court"],
      offices: [
        { name: "Nambiar Commercial Law Office", address: "Mananchira Square, Kozhikode", locality: localityRows["mananchira"], lat: 11.251, lng: 75.78, isPrimary: true },
      ],
      posts: [
        {
          title: "Drafting Dealership Agreements That Hold Up in Court",
          slug: "drafting-dealership-agreements",
          excerpt: "Common gaps in Malabar's dealership contracts and how to fix them.",
          body: "Dealership agreements between manufacturers and regional distributors in Malabar frequently omit clear termination and territory clauses, leading to disputes later. This post covers the clauses I insist on including after handling over fifty commercial disputes.",
          daysAgo: 27,
        },
        {
          title: "When to Choose Arbitration Over Litigation",
          slug: "arbitration-vs-litigation-commercial-disputes",
          excerpt: "A cost and time comparison for business disputes.",
          body: "Arbitration clauses can significantly reduce the time to resolve a commercial dispute compared to civil litigation, but they are not right for every contract. This post compares typical timelines and costs based on cases handled in Kozhikode.",
          daysAgo: 3,
        },
      ],
      caseSummaries: [
        {
          title: "Arbitration award upheld on dealership termination dispute",
          outcome: OutcomeTag.favorable,
          summary: "Represented a distributor in an arbitration over wrongful termination of a dealership agreement; the tribunal awarded compensation in the client's favour.",
        },
        {
          title: "Commercial supply dispute",
          outcome: OutcomeTag.pending,
          summary: "Currently representing a trading firm in a supply contract dispute pending before the Kozhikode District Court.",
        },
      ],
      reviews: [
        { reviewerName: "Ashraf K", rating: 5, comment: "Redrafted our dealership contracts and caught issues we'd missed for years.", daysAgo: 8 },
        { reviewerName: "Beena Thomas", rating: 5, comment: "Won our arbitration case, extremely knowledgeable in commercial law.", daysAgo: 60 },
        { reviewerName: "Rajeev Balan", rating: 4, comment: "Good lawyer, slightly hard to reach during peak season.", daysAgo: 100 },
      ],
    },
    {
      name: "Meera Warrier",
      slug: "meera-warrier",
      profileType: "free",
      tagline: "Criminal defence and family mediation in Kozhikode",
      bio: "Meera Warrier handles criminal defence and family mediation matters in Kozhikode, with particular experience in juvenile justice proceedings and matrimonial disputes.",
      whatsapp: "+919847089012",
      contactHours: "Mon–Sat, 10:00 AM – 5:30 PM",
      city: kozhikode,
      locality: localityRows["west-hill"],
      categorySlugs: ["criminal-law", "family-law"],
      institutionSlugs: ["kozhikode-district-court"],
      offices: [
        { name: "Meera Warrier Advocate", address: "West Hill, Kozhikode", locality: localityRows["west-hill"], lat: 11.275, lng: 75.77, isPrimary: true },
      ],
      posts: [
        {
          title: "Juvenile Justice: What Parents Should Know",
          slug: "juvenile-justice-what-parents-should-know",
          excerpt: "How proceedings differ when the accused is a minor.",
          body: "The Juvenile Justice Act provides a distinct process for minors in conflict with law, focused on rehabilitation rather than punishment. This post explains what parents can expect from a Juvenile Justice Board proceeding in Kozhikode.",
          daysAgo: 22,
        },
      ],
      caseSummaries: [
        {
          title: "Juvenile matter resolved with counselling order",
          outcome: OutcomeTag.settled,
          summary: "Represented a minor before the Juvenile Justice Board, resulting in a counselling and community service order rather than a formal conviction.",
        },
      ],
      reviews: [
        { reviewerName: "Faisal Rahman", rating: 5, comment: "Handled a sensitive family matter with a lot of care.", daysAgo: 35 },
        { reviewerName: "Chandini P", rating: 4, comment: "Knowledgeable and patient with our questions.", daysAgo: 75 },
      ],
    },
    {
      name: "Kiran Thomas",
      slug: "kiran-thomas",
      profileType: "professional",
      tagline: "Income tax and GST litigation for individuals and businesses",
      bio: "Kiran Thomas represents individuals and small businesses in Kozhikode in income tax assessments, GST audits, and appeals before the Income Tax Appellate Tribunal, with 12 years of practice in tax law.",
      whatsapp: "+919847090123",
      contactHours: "Mon–Sat, 9:30 AM – 6:30 PM",
      city: kozhikode,
      locality: localityRows["palayam-kzd"],
      categorySlugs: ["tax-law"],
      institutionSlugs: ["kozhikode-district-court"],
      offices: [
        { name: "Kiran Thomas Tax Chambers", address: "Palayam, Kozhikode", locality: localityRows["palayam-kzd"], lat: 11.245, lng: 75.775, isPrimary: true },
      ],
      posts: [
        {
          title: "Responding to an Income Tax Scrutiny Notice",
          slug: "responding-income-tax-scrutiny-notice",
          excerpt: "A practical timeline for individuals and small businesses.",
          body: "An income tax scrutiny notice under Section 143(2) requires a timely and well-documented response. This post outlines the typical timeline, the records assessing officers usually request, and how to prepare for a hearing.",
          daysAgo: 14,
        },
        {
          title: "GST Input Tax Credit Disputes: Common Causes",
          slug: "gst-input-tax-credit-disputes",
          excerpt: "Why ITC claims get rejected and how to appeal.",
          body: "Input tax credit claims are frequently rejected due to mismatches between GSTR-2A and supplier filings. This post explains the most common causes of ITC disputes seen in Kozhikode and the appeal process before the GST Appellate Authority.",
          daysAgo: 2,
        },
      ],
      caseSummaries: [
        {
          title: "Income tax addition deleted on appeal",
          outcome: OutcomeTag.favorable,
          summary: "Successfully argued before the Commissioner (Appeals) that an addition to income was based on incorrect assumptions, resulting in the addition being deleted.",
        },
        {
          title: "GST penalty proceedings",
          outcome: OutcomeTag.unfavorable,
          summary: "A penalty for delayed GST filing was upheld on appeal despite arguments citing reasonable cause; a further appeal is being considered.",
        },
      ],
      reviews: [
        { reviewerName: "Sabu Varghese", rating: 5, comment: "Got an unfair tax addition reversed on appeal, very thorough.", daysAgo: 18 },
        { reviewerName: "Rincy Joseph", rating: 5, comment: "Explained our GST notice clearly and handled the reply promptly.", daysAgo: 48 },
        { reviewerName: "Mohammed Ali", rating: 4, comment: "Good expertise in tax matters, a bit expensive for small businesses.", daysAgo: 85 },
      ],
    },
    {
      name: "Lakshmi Iyer",
      slug: "lakshmi-iyer",
      profileType: "free",
      tagline: "Civil litigation and criminal defence in Kochi",
      bio: "Lakshmi Iyer handles civil recovery suits and criminal defence matters in Kochi, with six years of experience appearing before the Ernakulam District Court.",
      whatsapp: "+919847001234",
      contactHours: "Mon–Sat, 10:30 AM – 6:00 PM",
      city: kochi,
      locality: localityRows["kakkanad"],
      categorySlugs: ["civil-litigation", "criminal-law"],
      institutionSlugs: ["ernakulam-district-court"],
      offices: [
        { name: "Lakshmi Iyer Advocate", address: "Civil Station Road, Kakkanad", locality: localityRows["kakkanad"], lat: 10.0159, lng: 76.3419, isPrimary: true },
      ],
      posts: [
        {
          title: "Filing a Money Recovery Suit in Kerala: An Overview",
          slug: "money-recovery-suit-kerala-overview",
          excerpt: "The basic process for recovering unpaid dues through court.",
          body: "A money recovery suit is the standard civil remedy for unpaid loans or dues in Kerala. This post covers jurisdiction, limitation periods, and what documentary evidence strengthens a recovery claim.",
          daysAgo: 12,
        },
      ],
      caseSummaries: [
        {
          title: "Recovery suit decreed in client's favour",
          outcome: OutcomeTag.favorable,
          summary: "Obtained a money decree for a client owed dues under an unpaid business loan, including interest from the date of default.",
        },
      ],
      reviews: [
        { reviewerName: "Vinod Pillai", rating: 4, comment: "Handled our recovery suit efficiently and kept us updated.", daysAgo: 28 },
        { reviewerName: "Anitha Suresh", rating: 5, comment: "Very approachable and explained everything in simple terms.", daysAgo: 70 },
        { reviewerName: "Joseph Kutty", rating: 4, comment: "Good advocate for straightforward civil matters.", daysAgo: 120 },
      ],
    },
  ];

  for (const p of profileSeeds) {
    const profile = await db.profile.create({
      data: {
        verticalId: lawyer.id,
        profileType: p.profileType,
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        bio: p.bio,
        photoUrl: placeholderPhoto(p.slug),
        whatsappNumber: p.whatsapp,
        contactHours: p.contactHours,
        primaryLocalityId: p.locality.id,
      },
    });

    for (const catSlug of p.categorySlugs) {
      await db.profileCategory.create({
        data: { profileId: profile.id, categoryId: categories[catSlug].id },
      });
    }
    for (const instSlug of p.institutionSlugs) {
      await db.profileInstitution.create({
        data: { profileId: profile.id, institutionId: institutions[instSlug].id },
      });
    }
    for (const o of p.offices) {
      await db.office.create({
        data: {
          profileId: profile.id,
          name: o.name,
          address: o.address,
          localityId: o.locality.id,
          latitude: o.lat,
          longitude: o.lng,
          isPrimary: o.isPrimary,
        },
      });
    }
    for (const post of p.posts) {
      await db.post.create({
        data: {
          profileId: profile.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          coverImageUrl: placeholderPhoto(`${p.slug}-${post.slug}`),
          publishedAt: days(post.daysAgo),
        },
      });
    }
    for (const cs of p.caseSummaries) {
      await db.caseSummary.create({
        data: {
          profileId: profile.id,
          title: cs.title,
          outcomeTag: cs.outcome,
          summary: cs.summary,
          referenceLink: cs.referenceLink,
        },
      });
    }
    for (const r of p.reviews) {
      await db.review.create({
        data: {
          profileId: profile.id,
          reviewerName: r.reviewerName,
          rating: r.rating,
          comment: r.comment,
          createdAt: days(r.daysAgo),
        },
      });
    }
    console.log(`  seeded profile: ${p.name} (${p.profileType})`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
