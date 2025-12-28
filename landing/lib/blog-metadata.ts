import { Metadata } from "next";

export interface BlogMetadataParams {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  publishedDate: string;
}

export function generateBlogMetadata({
  title,
  description,
  keywords,
  slug,
  publishedDate,
}: BlogMetadataParams): Metadata {
  const url = `https://taskmelt.app/blog/${slug}`;

  return {
    title: `${title} | taskmelt Blog`,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url,
      siteName: "taskmelt",
      images: [
        {
          url: "https://taskmelt.app/icon.png",
          width: 512,
          height: 512,
          alt: title,
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime: publishedDate,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://taskmelt.app/icon.png"],
    },
    alternates: {
      canonical: url,
    },
  };
}
