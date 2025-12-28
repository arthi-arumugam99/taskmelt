import { Metadata } from "next";
import Link from "next/link";
import StructuredData from "@/components/StructuredData";
import RelatedArticles from "@/components/RelatedArticles";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/schemas";

const slug = "deep-work-guide";
const title = "Deep Work: Complete Guide to Focused Success (2025)";
const description = "Master deep work to produce your best work. Learn Cal Newport's proven strategies for intense focus in a distracted world.";
const publishDate = "2025-12-18T10:00:00Z";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "deep work",
    "deep work cal newport",
    "focused work",
    "deep focus",
    "concentration techniques",
    "deep work rules",
    "how to focus deeply",
    "distraction-free work",
    "cognitive concentration"
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
    "title": "The Pomodoro Technique Guide",
    "slug": "pomodoro-technique",
    "description": "Master the 25-minute focus technique used by millions."
  },
  {
    "title": "Time Blocking Guide: Master Your Schedule",
    "slug": "time-blocking-guide",
    "description": "Complete guide to time blocking for maximum productivity and focus."
  },
  {
    "title": "Overcome Procrastination: Proven Strategies",
    "slug": "overcome-procrastination",
    "description": "Science-backed techniques to beat procrastination and take action."
  },
  {
    "title": "Morning Routine for Peak Productivity",
    "slug": "morning-routine-productivity",
    "description": "Build a morning routine that sets you up for daily success."
  }
];

export default function DeepWork() {
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
          <span className="inline-block px-4 py-2 bg-taskmelt-blue text-sm font-bold rounded-full mb-4">Focus</span>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Deep Work: How to Focus in a Distracted World</h1>
          <p className="text-xl text-taskmelt-gray">December 18, 2025 · 11 min read</p>
        </header>
        <div className="prose prose-lg max-w-none space-y-8 text-lg leading-relaxed">
          <p className="text-2xl font-medium text-taskmelt-gray">In a world of constant distractions, deep work is your competitive advantage.</p>
          <h2 className="text-4xl font-black mt-12 mb-6">What is Deep Work?</h2>
          <p>Deep work is professional activity performed in a state of distraction-free concentration that pushes your cognitive capabilities to their limit. These efforts create new value, improve your skill, and are hard to replicate.</p>
          <h2 className="text-4xl font-black mt-12 mb-6">The 4 Rules of Deep Work</h2>
          <h3 className="text-3xl font-bold mt-8 mb-4">1. Work Deeply</h3>
          <p>Schedule deep work blocks. Protect this time fiercely. Treat it like important meetings.</p>
          <h3 className="text-3xl font-bold mt-8 mb-4">2. Embrace Boredom</h3>
          <p>Train your brain to resist distraction. Don't reach for your phone every idle moment.</p>
          <h3 className="text-3xl font-bold mt-8 mb-4">3. Quit Social Media</h3>
          <p>Or at least be intentional. Social media is engineered to fragment your attention.</p>
          <h3 className="text-3xl font-bold mt-8 mb-4">4. Drain the Shallows</h3>
          <p>Minimize shallow work (email, meetings, admin). Batch it into specific time blocks.</p>
          <div className="taskmelt-border bg-taskmelt-peach p-8 my-12">
            <h3 className="text-2xl font-black mb-4">Schedule Deep Work Blocks</h3>
            <p className="mb-6">taskmelt's time blocking automatically protects your deep work hours. No interruptions.</p>
            <Link href="/#download" className="inline-block taskmelt-border bg-taskmelt-black text-white px-8 py-4 text-lg font-bold">Try Free</Link>
          </div>
          <h2 className="text-4xl font-black mt-12 mb-6">Creating Your Deep Work Ritual</h2>
          <p>Where will you work? For how long? What will you do to start? Rituals reduce friction and signal to your brain: it's time to focus.</p>
        </div>
        <RelatedArticles articles={relatedArticles} />
        </div>
      </article>
    </>
  );
}
