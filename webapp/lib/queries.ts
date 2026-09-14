import { db, notDeleted } from "@/lib/db";
import { LocationType } from "@prisma/client";

function avgRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

/** Profiles located in a city = primary locality is the city itself, or a locality directly under it. */
function inCity(cityId: number) {
  return {
    primaryLocality: { OR: [{ id: cityId }, { parentId: cityId }] },
  };
}

export async function getSiteCounts() {
  const [professionals, categories, cities, courts] = await Promise.all([
    db.profile.count({ where: notDeleted }),
    db.category.count(),
    db.locality.count({ where: { locationType: LocationType.city, ...notDeleted } }),
    db.institution.count({ where: notDeleted }),
  ]);
  return { professionals, categories, cities, courts };
}

export async function getCategoriesWithCounts() {
  const categories = await db.category.findMany({
    include: { _count: { select: { profileCategories: true } } },
    orderBy: { name: "asc" },
  });
  return categories.map((c) => ({ ...c, profileCount: c._count.profileCategories }));
}

export async function getCitiesWithCounts() {
  const cities = await db.locality.findMany({
    where: { locationType: LocationType.city, ...notDeleted },
    orderBy: { name: "asc" },
  });
  const counts = await Promise.all(
    cities.map((city) => db.profile.count({ where: { ...notDeleted, ...inCity(city.id) } })),
  );
  return cities.map((city, i) => ({ ...city, profileCount: counts[i] }));
}

export async function getTopRatedProfiles(limit = 4) {
  const profiles = await db.profile.findMany({
    where: notDeleted,
    include: {
      reviews: { where: notDeleted },
      primaryLocality: { include: { parent: true } },
      profileCategories: { include: { category: true } },
    },
  });
  return profiles
    .map((p) => ({ ...p, rating: avgRating(p.reviews), reviewCount: p.reviews.length }))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export async function getCourtsWithCity(limit = 5) {
  return db.institution.findMany({
    where: notDeleted,
    include: { locality: true },
    orderBy: { name: "asc" },
    take: limit,
  });
}

export async function getCityBySlug(slug: string) {
  return db.locality.findFirst({
    where: { slug, locationType: LocationType.city, ...notDeleted },
  });
}

export async function getCityPageData(citySlug: string) {
  const city = await getCityBySlug(citySlug);
  if (!city) return null;

  const [localities, allCategories, institutions, allCities] = await Promise.all([
    db.locality.findMany({ where: { parentId: city.id, ...notDeleted }, orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.institution.findMany({ where: { localityId: city.id, ...notDeleted }, orderBy: { name: "asc" } }),
    db.locality.findMany({ where: { locationType: LocationType.city, ...notDeleted }, orderBy: { name: "asc" } }),
  ]);

  const categoryCounts = await Promise.all(
    allCategories.map((cat) =>
      db.profile.count({
        where: { ...notDeleted, ...inCity(city.id), profileCategories: { some: { categoryId: cat.id } } },
      }),
    ),
  );
  const categories = allCategories
    .map((c, i) => ({ ...c, profileCount: categoryCounts[i] }))
    .filter((c) => c.profileCount > 0);

  const profiles = await db.profile.findMany({
    where: { ...notDeleted, ...inCity(city.id) },
    include: { reviews: { where: notDeleted }, primaryLocality: { include: { parent: true } }, profileCategories: { include: { category: true } } },
  });
  const topRated = profiles
    .map((p) => ({ ...p, rating: avgRating(p.reviews), reviewCount: p.reviews.length }))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount)
    .slice(0, 4);

  const nearbyCities = allCities.filter((c) => c.id !== city.id).slice(0, 4);

  return {
    city,
    localities,
    categories,
    institutions,
    topRated,
    nearbyCities,
    professionalCount: profiles.length,
  };
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function getCityCategoryPageData(citySlug: string, categorySlug: string) {
  const [city, category] = await Promise.all([getCityBySlug(citySlug), getCategoryBySlug(categorySlug)]);
  if (!city || !category) return null;

  const profiles = await db.profile.findMany({
    where: {
      ...notDeleted,
      ...inCity(city.id),
      profileCategories: { some: { categoryId: category.id } },
    },
    include: {
      reviews: { where: notDeleted },
      primaryLocality: { include: { parent: true } },
      profileCategories: { include: { category: true } },
      offices: { where: notDeleted, orderBy: { isPrimary: "desc" } },
    },
  });

  const results = profiles
    .map((p) => ({ ...p, rating: avgRating(p.reviews), reviewCount: p.reviews.length }))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount);

  return { city, category, results };
}

export async function getProfileBySlug(slug: string) {
  const profile = await db.profile.findFirst({
    where: { slug, ...notDeleted },
    include: {
      vertical: true,
      primaryLocality: { include: { parent: true } },
      profileCategories: { include: { category: true } },
      profileInstitutions: { include: { institution: { include: { locality: true } } } },
      offices: { where: notDeleted, include: { locality: true }, orderBy: { isPrimary: "desc" } },
      posts: { where: notDeleted, orderBy: { publishedAt: "desc" } },
      caseSummaries: { where: notDeleted },
      reviews: { where: notDeleted, orderBy: { createdAt: "desc" } },
    },
  });
  if (!profile) return null;

  const rating = avgRating(profile.reviews);

  let competitors: Awaited<ReturnType<typeof getTopRatedProfiles>> = [];
  if (profile.profileType === "free") {
    const categoryIds = profile.profileCategories.map((pc) => pc.categoryId);
    const cityId = profile.primaryLocality.parentId ?? profile.primaryLocality.id;
    const others = await db.profile.findMany({
      where: {
        ...notDeleted,
        id: { not: profile.id },
        ...inCity(cityId),
        profileCategories: { some: { categoryId: { in: categoryIds } } },
      },
      include: { reviews: { where: notDeleted }, primaryLocality: { include: { parent: true } }, profileCategories: { include: { category: true } } },
      take: 6,
    });
    competitors = others.map((p) => ({ ...p, rating: avgRating(p.reviews), reviewCount: p.reviews.length }));
  }

  return { ...profile, rating, reviewCount: profile.reviews.length, competitors };
}

export async function getPostBySlug(profileSlug: string, postSlug: string) {
  const profile = await db.profile.findFirst({ where: { slug: profileSlug, ...notDeleted } });
  if (!profile) return null;
  const post = await db.post.findFirst({ where: { slug: postSlug, profileId: profile.id, ...notDeleted } });
  if (!post) return null;
  return { post, profile };
}

export async function getInstitutionBySlug(slug: string) {
  const institution = await db.institution.findFirst({
    where: { slug, ...notDeleted },
    include: { locality: { include: { parent: true } } },
  });
  if (!institution) return null;

  const [advocates, related] = await Promise.all([
    db.profile.findMany({
      where: { ...notDeleted, profileInstitutions: { some: { institutionId: institution.id } } },
      include: { primaryLocality: { include: { parent: true } }, profileCategories: { include: { category: true } } },
      take: 6,
    }),
    db.institution.findMany({
      where: { ...notDeleted, id: { not: institution.id }, localityId: institution.localityId },
      take: 4,
    }),
  ]);

  return { institution, advocates, related };
}

const EARTH_RADIUS_KM = 6371;

export async function getNearbyOffices(lat: number, lng: number, limit = 20) {
  const rows = await db.$queryRaw<
    Array<{
      officeId: number;
      officeName: string | null;
      address: string;
      profileId: number;
      profileName: string;
      profileSlug: string;
      profilePhotoUrl: string;
      tagline: string | null;
      whatsappNumber: string;
      distanceKm: number;
    }>
  >`
    SELECT
      o.id AS officeId,
      o.name AS officeName,
      o.address AS address,
      p.id AS profileId,
      p.name AS profileName,
      p.slug AS profileSlug,
      p.photo_url AS profilePhotoUrl,
      p.tagline AS tagline,
      p.whatsapp_number AS whatsappNumber,
      (${EARTH_RADIUS_KM} * ACOS(
        COS(RADIANS(${lat})) * COS(RADIANS(o.latitude)) * COS(RADIANS(o.longitude) - RADIANS(${lng}))
        + SIN(RADIANS(${lat})) * SIN(RADIANS(o.latitude))
      )) AS distanceKm
    FROM offices o
    INNER JOIN profiles p ON p.id = o.profile_id
    WHERE o.deleted_at IS NULL AND p.deleted_at IS NULL
    ORDER BY distanceKm ASC
    LIMIT ${limit}
  `;
  return rows;
}

export async function getAllSlugsForSitemap() {
  const [profiles, cities, categoryLinks, institutions, posts] = await Promise.all([
    db.profile.findMany({ where: notDeleted, select: { slug: true, updatedAt: true } }),
    db.locality.findMany({ where: { locationType: LocationType.city, ...notDeleted }, select: { slug: true } }),
    db.profile.findMany({
      where: notDeleted,
      select: {
        primaryLocality: { select: { slug: true, parent: { select: { slug: true } } } },
        profileCategories: { select: { category: { select: { slug: true } } } },
      },
    }),
    db.institution.findMany({ where: notDeleted, select: { slug: true } }),
    db.post.findMany({
      where: notDeleted,
      select: { slug: true, publishedAt: true, profile: { select: { slug: true } } },
    }),
  ]);

  const cityCategoryPairs = new Set<string>();
  for (const p of categoryLinks) {
    const citySlug = p.primaryLocality.parent?.slug ?? p.primaryLocality.slug;
    for (const pc of p.profileCategories) {
      cityCategoryPairs.add(`${citySlug}/${pc.category.slug}`);
    }
  }

  return { profiles, cities, institutions, posts, cityCategoryPairs: [...cityCategoryPairs] };
}
