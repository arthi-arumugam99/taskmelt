import { Metadata } from "next";
import Link from "next/link";
import StructuredData from "@/components/StructuredData";
import RelatedArticles from "@/components/RelatedArticles";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/schemas";

const slug = "getting-things-done";
const title = "Getting Things Done (GTD): Complete Guide to David Allen's System (2025)";
const description = "Master the Getting Things Done (GTD) methodology for stress-free productivity. Complete guide to David Allen's proven system.";
const publishDate = "2025-12-19T10:00:00Z";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "getting things done",
    "GTD method",
    "david allen gtd",
    "gtd system",
    "productivity system gtd",
    "gtd workflow",
    "getting things done book",
    "gtd methodology",
    "task management system"
],
  openGraph: {
    title,
    description,
    url: `https://taskmelt.com/blog/${slug}`,
    type: "article",
    publishedTime: publishDate,
    authors: ["taskmelt Team"],
    siteName: "taskmelt",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@taskmelt",
  },
  alternates: {
    canonical: `https://taskmelt.com/blog/${slug}`,
  },
};

const relatedArticles = [
  {
    "title": "The Brain Dump Technique: Clear Mental Clutter",
    "slug": "brain-dump-technique-productivity",
    "description": "Learn how to use brain dumping to reduce overwhelm and boost productivity."
  },
  {
    "title": "Time Blocking Guide: Master Your Schedule",
    "slug": "time-blocking-guide",
    "description": "Complete guide to time blocking for maximum productivity and focus."
  },
  {
    "title": "Best Productivity Apps Comparison",
    "slug": "productivity-apps-comparison",
    "description": "Compare the top productivity apps to find your perfect tool."
  },
  {
    "title": "Build Lasting Habits That Stick",
    "slug": "build-lasting-habits",
    "description": "Science-based strategies to build habits that last a lifetime."
  }
];

export default function GTD() {
  const articleSchema = generateArticleSchema({
    title,
    description,
    publishDate,
    slug,
  });

  const breadcrumbSchema = generateBreadcrumbSchema({
    slug,
    title,
  });

  return (
    <>
      <StructuredData data={articleSchema} />
      <StructuredData data={breadcrumbSchema} />

      <article className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/blog" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">← Back to Blog</Link>
        <header className="mb-12">
          <span className="inline-block px-4 py-2 bg-taskmelt-green text-sm font-bold rounded-full mb-4">Systems</span>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Getting Things Done: The Complete GTD Guide</h1>
          <p className="text-xl text-taskmelt-gray">December 17, 2025 · 12 min read</p>
        </header>
        <div className="prose prose-lg max-w-none space-y-8 text-lg leading-relaxed">
          <p className="text-2xl font-medium text-taskmelt-gray">GTD is the gold standard productivity system. Here's how to implement it.</p>
          <h2 className="text-4xl font-black mt-12 mb-6">The 5 Steps of GTD</h2>
          <h3 className="text-3xl font-bold mt-8 mb-4">1. Capture</h3>
          <p>Collect everything that has your attention. Brain dump into a trusted system.</p>
          <h3 className="text-3xl font-bold mt-8 mb-4">2. Clarify</h3>
          <p>Process each item. Is it actionable? What's the next action?</p>
          <h3 className="text-3xl font-bold mt-8 mb-4">3. Organize</h3>
          <p>Put items in the right place. Next actions, projects, waiting for, someday/maybe.</p>
          <h3 className="text-3xl font-bold mt-8 mb-4">4. Reflect</h3>
          <p>Weekly review to stay current. Review all projects and next actions.</p>
          <h3 className="text-3xl font-bold mt-8 mb-4">5. Engage</h3>
          <p>Do the work. Trust your system to show you the right task at the right time.</p>
          <div className="taskmelt-border bg-taskmelt-blue p-8 my-12">
            <p className="mb-6">taskmelt implements GTD principles with AI. Capture everything, let AI organize it automatically.</p>
            <Link href="/#download" className="inline-block taskmelt-border bg-taskmelt-black text-white px-8 py-4 text-lg font-bold">Download Free</Link>
          </div>
        </div>
        <RelatedArticles articles={relatedArticles} />
        </div>
      </article>
    </>
  );
}
