import { Metadata } from "next";
import Link from "next/link";
import StructuredData from "@/components/StructuredData";
import RelatedArticles from "@/components/RelatedArticles";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/schemas";

const slug = "pomodoro-technique";
const title = "The Pomodoro Technique: Complete Guide (2025)";
const description = "Master the Pomodoro Technique for laser focus and productivity. Learn the 25-minute method that millions use to get more done.";
const publishDate = "2025-12-20T10:00:00Z";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "pomodoro technique",
    "pomodoro timer",
    "time management pomodoro",
    "focus technique",
    "25 minute work method",
    "pomodoro productivity",
    "tomato timer technique",
    "study technique pomodoro",
    "deep focus method"
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
    "title": "Time Blocking Guide: Master Your Schedule",
    "slug": "time-blocking-guide",
    "description": "Complete guide to time blocking for maximum productivity and focus."
  },
  {
    "title": "Deep Work Guide: Focus in a Distracted World",
    "slug": "deep-work-guide",
    "description": "Learn Cal Newport's deep work principles to produce your best work."
  },
  {
    "title": "Overcome Procrastination: Proven Strategies",
    "slug": "overcome-procrastination",
    "description": "Science-backed techniques to beat procrastination and take action."
  },
  {
    "title": "Best Productivity Apps Comparison",
    "slug": "productivity-apps-comparison",
    "description": "Compare the top productivity apps to find your perfect tool."
  }
];

export default function PomodoroTechnique() {
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
          <span className="inline-block px-4 py-2 bg-taskmelt-pink text-sm font-bold rounded-full mb-4">Focus</span>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Pomodoro Technique: The 25-Minute Productivity Method</h1>
          <p className="text-xl text-taskmelt-gray">December 20, 2025 · 8 min read</p>
        </header>
        <div className="prose prose-lg max-w-none space-y-8 text-lg leading-relaxed">
          <p className="text-2xl font-medium text-taskmelt-gray">
            The Pomodoro Technique is one of the most popular productivity methods. Here's how to use it effectively.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">What is the Pomodoro Technique?</h2>
          <p>Developed by Francesco Cirillo in the 1980s, the Pomodoro Technique breaks work into 25-minute focused intervals (called "pomodoros") separated by 5-minute breaks.</p>

          <h2 className="text-4xl font-black mt-12 mb-6">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Choose a task</li>
            <li>Set a timer for 25 minutes</li>
            <li>Work with full focus until the timer rings</li>
            <li>Take a 5-minute break</li>
            <li>After 4 pomodoros, take a longer 15-30 minute break</li>
          </ol>

          <h2 className="text-4xl font-black mt-12 mb-6">Why 25 Minutes?</h2>
          <p>Research shows 25 minutes is the sweet spot for sustained focus before mental fatigue sets in. It's long enough to make progress but short enough to maintain intensity.</p>

          <div className="taskmelt-border bg-taskmelt-blue p-8 my-12">
            <h3 className="text-2xl font-black mb-4">Built-in Pomodoro Timer</h3>
            <p className="mb-6">taskmelt includes Pomodoro timers for each task. Focus deeply, track your progress.</p>
            <Link href="/#download" className="inline-block taskmelt-border bg-taskmelt-black text-white px-8 py-4 text-lg font-bold">Download Free</Link>
          </div>

          <h2 className="text-4xl font-black mt-12 mb-6">Common Mistakes</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Skipping breaks (leads to burnout)</li>
            <li>Multitasking during pomodoros</li>
            <li>Not planning tasks beforehand</li>
            <li>Being too rigid with the 25-minute rule</li>
          </ul>

          <p className="text-2xl font-bold mt-8">Try one pomodoro right now. You'll be amazed at what you accomplish.</p>
        </div>
        <RelatedArticles articles={relatedArticles} />
        </div>
      </article>
    </>
  );
}
