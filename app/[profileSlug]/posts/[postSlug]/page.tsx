import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/site";
import { getCategoriesWithCounts, getCitiesWithCounts, getPostBySlug } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileSlug: string; postSlug: string }>;
}): Promise<Metadata> {
  const { profileSlug, postSlug } = await params;
  const data = await getPostBySlug(profileSlug, postSlug);
  if (!data) return {};
  const { post } = data;
  return {
    title: post.title,
    description: post.excerpt ?? post.body.slice(0, 155),
    alternates: { canonical: `${siteUrl}/${profileSlug}/posts/${postSlug}` },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ profileSlug: string; postSlug: string }>;
}) {
  const { profileSlug, postSlug } = await params;
  const [data, categories, cities] = await Promise.all([
    getPostBySlug(profileSlug, postSlug),
    getCategoriesWithCounts(),
    getCitiesWithCounts(),
  ]);
  if (!data) notFound();

  const { post, profile } = data;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt ?? undefined,
          image: post.coverImageUrl ?? undefined,
          datePublished: post.publishedAt.toISOString(),
          author: { "@type": "Person", name: profile.name, url: `${siteUrl}/${profile.slug}` },
        }}
      />
      <SiteHeader categories={categories} cities={cities} />
      <main className="flex-1">
        <article className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto max-w-measure">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: profile.name, href: `/${profile.slug}` },
                { label: post.title },
              ]}
            />
            <h1 className="mt-2 text-h1 text-ink">{post.title}</h1>
            <p className="mt-2 text-small text-ink-700">
              By{" "}
              <Link href={`/${profile.slug}`} className="hover:underline">
                {profile.name}
              </Link>{" "}
              ·{" "}
              {post.publishedAt.toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {post.coverImageUrl ? (
              <div className="relative mt-6 aspect-video w-full overflow-hidden bg-white">
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1200px) 720px, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            <p className="mt-6 whitespace-pre-line text-body-lg text-ink-800">{post.body}</p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
