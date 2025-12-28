import { Metadata } from "next";
import Link from "next/link";
import StructuredData from "@/components/StructuredData";
import RelatedArticles from "@/components/RelatedArticles";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/schemas";

const slug = "morning-routine-productivity";
const title = "The Perfect Morning Routine for Maximum Productivity (2025 Guide)";
const description = "Build a powerful morning routine that sets you up for daily success. Science-backed strategies from top performers.";
const publishDate = "2025-12-23T10:00:00Z";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "morning routine",
    "morning routine for productivity",
    "productive morning",
    "morning habits",
    "morning ritual",
    "wake up routine",
    "successful morning routine",
    "morning routine ideas",
    "productivity morning routine"
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
    "title": "Build Lasting Habits That Stick",
    "slug": "build-lasting-habits",
    "description": "Science-based strategies to build habits that last a lifetime."
  },
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
    "title": "Deep Work Guide: Focus in a Distracted World",
    "slug": "deep-work-guide",
    "description": "Learn Cal Newport's deep work principles to produce your best work."
  }
];

export default function MorningRoutine() {
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
          <span className="inline-block px-4 py-2 bg-taskmelt-peach text-sm font-bold rounded-full mb-4">Routines</span>
          <h1 className="text-5xl md:text-6xl font-black mb-6">The Perfect Morning Routine for Peak Productivity</h1>
          <p className="text-xl text-taskmelt-gray">December 19, 2025 · 9 min read</p>
        </header>
        <div className="prose prose-lg max-w-none space-y-8 text-lg leading-relaxed">
          <p className="text-2xl font-medium text-taskmelt-gray">How you start your morning sets the tone for your entire day. Here's how to build a morning routine that actually works.</p>

          <h2 className="text-4xl font-black mt-12 mb-6">The Science of Morning Routines</h2>
          <p>Your cortisol levels peak in the morning, giving you natural energy and focus. A structured morning routine capitalizes on this biological advantage.</p>

          <h2 className="text-4xl font-black mt-12 mb-6">The Perfect Morning Routine</h2>
          <h3 className="text-3xl font-bold mt-8 mb-4">6:00 AM - Wake Up (No Snooze)</h3>
          <p>Place your phone across the room. Snoozing disrupts your sleep cycle and starts your day with decision fatigue.</p>

          <h3 className="text-3xl font-bold mt-8 mb-4">6:05 AM - Hydrate</h3>
          <p>Drink 16oz of water. You're dehydrated after 8 hours of sleep.</p>

          <h3 className="text-3xl font-bold mt-8 mb-4">6:10 AM - Move Your Body</h3>
          <p>10-minute walk, yoga, or stretching. Movement wakes up your mind.</p>

          <h3 className="text-3xl font-bold mt-8 mb-4">6:20 AM - Brain Dump</h3>
          <p>Spend 5 minutes dumping all thoughts into taskmelt. Clear your mind before the day begins.</p>

          <h3 className="text-3xl font-bold mt-8 mb-4">6:30 AM - Deep Work</h3>
          <p>Your most important task of the day. 90 minutes of focused work while your mind is fresh.</p>

          <div className="taskmelt-border bg-taskmelt-green p-8 my-12">
            <h3 className="text-2xl font-black mb-4">Morning Brain Dump Ritual</h3>
            <p className="mb-6">Start every morning with a brain dump in taskmelt. Clear your mind, get organized, win the day.</p>
            <Link href="/#download" className="inline-block taskmelt-border bg-taskmelt-black text-white px-8 py-4 text-lg font-bold">Start Free</Link>
          </div>

          <h2 className="text-4xl font-black mt-12 mb-6">Customizing Your Routine</h2>
          <p>The best morning routine is one you'll actually do. Start with just one habit. Add more gradually. Track it in taskmelt to build consistency.</p>
        </div>
        <RelatedArticles articles={relatedArticles} />
        </div>
      </article>
    </>
  );
}
