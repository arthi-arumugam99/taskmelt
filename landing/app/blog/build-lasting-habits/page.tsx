import { Metadata } from "next";
import Link from "next/link";
import StructuredData from "@/components/StructuredData";
import RelatedArticles from "@/components/RelatedArticles";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/schemas";

const slug = "build-lasting-habits";
const title = "How to Build Lasting Habits: Science-Based Guide (2025)";
const description = "Build habits that actually stick using behavioral psychology. Learn the science of habit formation and lasting change.";
const publishDate = "2025-12-22T10:00:00Z";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "build habits",
    "habit formation",
    "lasting habits",
    "how to build habits",
    "habit stacking",
    "atomic habits",
    "habit science",
    "create new habits",
    "habit loop",
    "behavior change"
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
    "title": "Morning Routine for Peak Productivity",
    "slug": "morning-routine-productivity",
    "description": "Build a morning routine that sets you up for daily success."
  },
  {
    "title": "Overcome Procrastination: Proven Strategies",
    "slug": "overcome-procrastination",
    "description": "Science-backed techniques to beat procrastination and take action."
  },
  {
    "title": "The Pomodoro Technique Guide",
    "slug": "pomodoro-technique",
    "description": "Master the 25-minute focus technique used by millions."
  },
  {
    "title": "Getting Things Done (GTD) System Explained",
    "slug": "getting-things-done",
    "description": "Master David Allen's GTD methodology for stress-free productivity."
  }
];

export default function BuildHabits() {
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
        <Link href="/blog" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">
          ← Back to Blog
        </Link>
        <header className="mb-12">
          <span className="inline-block px-4 py-2 bg-taskmelt-green text-sm font-bold rounded-full mb-4">Habits</span>
          <h1 className="text-5xl md:text-6xl font-black mb-6">How to Build Lasting Habits: The Science-Backed Approach</h1>
          <p className="text-xl text-taskmelt-gray">December 23, 2025 · 12 min read</p>
        </header>
        <div className="prose prose-lg max-w-none space-y-8 text-lg leading-relaxed">
          <p className="text-2xl font-medium text-taskmelt-gray">
            Want to build habits that actually stick? Here's what behavioral science tells us about creating lasting change.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">Why Most Habits Fail</h2>
          <p>
            Studies show that 80% of New Year's resolutions fail by February. The problem isn't willpower—it's approach.
            Most people rely on motivation, which is unreliable. Instead, you need systems.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">The Habit Loop</h2>
          <p>Every habit follows a simple loop:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Cue:</strong> The trigger that initiates the behavior</li>
            <li><strong>Routine:</strong> The behavior itself</li>
            <li><strong>Reward:</strong> The benefit you gain from doing it</li>
          </ul>

          <h2 className="text-4xl font-black mt-12 mb-6">The 4 Laws of Behavior Change</h2>

          <h3 className="text-3xl font-bold mt-8 mb-4">1. Make It Obvious</h3>
          <p>
            The best way to start a new habit is to anchor it to an existing one (habit stacking).
            Example: "After I pour my morning coffee, I will do 10 pushups."
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">2. Make It Attractive</h3>
          <p>
            Pair habits you need to do with habits you want to do. Want to watch Netflix? Only while on the treadmill.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">3. Make It Easy</h3>
          <p>
            Start ridiculously small. Want to read more? Start with one page. The 2-minute rule: any habit can be
            started in less than 2 minutes.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">4. Make It Satisfying</h3>
          <p>
            Track your progress visually. There's something deeply satisfying about not breaking the chain.
          </p>

          <div className="taskmelt-border bg-taskmelt-green p-8 my-12">
            <h3 className="text-2xl font-black mb-4">Track Habits with taskmelt</h3>
            <p className="mb-6">
              Visual habit tracking with streaks, calendar view, and daily reminders. Never break the chain.
            </p>
            <Link href="/#download" className="inline-block taskmelt-border bg-taskmelt-black text-white px-8 py-4 text-lg font-bold">
              Download Free
            </Link>
          </div>

          <h2 className="text-4xl font-black mt-12 mb-6">Common Mistakes</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Starting too big (run a marathon vs walk 10 minutes)</li>
            <li>Relying on motivation instead of systems</li>
            <li>Not tracking progress</li>
            <li>Trying to change too many habits at once</li>
            <li>Giving up after one missed day</li>
          </ul>

          <p className="text-2xl font-bold mt-8">
            Remember: You don't rise to the level of your goals. You fall to the level of your systems.
          </p>
        </div>
        <RelatedArticles articles={relatedArticles} />
        </div>
      </article>
    </>
  );
}
