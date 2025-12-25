import { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Productivity Blog - taskmelt | Tips, Guides & Best Practices",
  description: "Learn productivity tips, time management strategies, and how to build better habits with expert guides from taskmelt.",
  keywords: ["productivity tips", "time management", "habit building", "task management", "productivity hacks", "getting things done"],
};

const blogPosts = [
  {
    slug: "brain-dump-technique-productivity",
    title: "The Brain Dump Technique: How to Clear Mental Clutter and Boost Productivity",
    description: "Discover how brain dumping can transform your productivity by clearing mental clutter and reducing overwhelm.",
    date: "December 25, 2025",
    readTime: "8 min read",
    category: "Productivity",
  },
  {
    slug: "time-blocking-guide",
    title: "The Complete Guide to Time Blocking for Maximum Productivity",
    description: "Master time blocking to take control of your schedule and accomplish more in less time.",
    date: "December 24, 2025",
    readTime: "10 min read",
    category: "Time Management",
  },
  {
    slug: "build-lasting-habits",
    title: "How to Build Lasting Habits: The Science-Backed Approach",
    description: "Learn the proven strategies for building habits that stick using behavioral science principles.",
    date: "December 23, 2025",
    readTime: "12 min read",
    category: "Habits",
  },
  {
    slug: "overcome-procrastination",
    title: "How to Overcome Procrastination: 15 Science-Backed Strategies",
    description: "Stop procrastinating and start taking action with these proven strategies.",
    date: "December 22, 2025",
    readTime: "10 min read",
    category: "Productivity",
  },
  {
    slug: "productivity-apps-comparison",
    title: "Best Productivity Apps in 2025: Complete Comparison Guide",
    description: "In-depth comparison of the top productivity apps to help you choose the right tool for your workflow.",
    date: "December 21, 2025",
    readTime: "15 min read",
    category: "Tools",
  },
  {
    slug: "pomodoro-technique",
    title: "Pomodoro Technique: The 25-Minute Productivity Method",
    description: "Master the Pomodoro Technique for better focus and productivity.",
    date: "December 20, 2025",
    readTime: "8 min read",
    category: "Focus",
  },
  {
    slug: "morning-routine-productivity",
    title: "The Perfect Morning Routine for Peak Productivity",
    description: "Design a morning routine that sets you up for a productive and focused day.",
    date: "December 19, 2025",
    readTime: "9 min read",
    category: "Routines",
  },
  {
    slug: "deep-work-guide",
    title: "Deep Work: How to Focus in a Distracted World",
    description: "Master deep work to accomplish more in less time with intense focus.",
    date: "December 18, 2025",
    readTime: "11 min read",
    category: "Focus",
  },
  {
    slug: "getting-things-done",
    title: "Getting Things Done (GTD): Complete System Guide",
    description: "Master David Allen's GTD methodology for stress-free productivity.",
    date: "December 17, 2025",
    readTime: "12 min read",
    category: "Systems",
  },
];

export default function Blog() {
  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">
          ← Back to Home
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6">Productivity Blog</h1>
          <p className="text-xl md:text-2xl text-taskmelt-gray max-w-3xl mx-auto">
            Expert guides, tips, and strategies to help you work smarter, not harder
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="taskmelt-border bg-white p-6 hover:translate-x-1 hover:translate-y-1 transition-transform group"
            >
              <div className="mb-4">
                <span className="inline-block px-4 py-1 bg-taskmelt-blue text-sm font-bold rounded-full">
                  {post.category}
                </span>
              </div>

              <h2 className="text-2xl font-black mb-3 group-hover:text-taskmelt-blue transition-colors">
                {post.title}
              </h2>

              <p className="text-taskmelt-gray mb-4 line-clamp-3">
                {post.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-taskmelt-gray">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <section className="mt-20 taskmelt-border bg-taskmelt-peach p-12 text-center">
          <h2 className="text-4xl font-black mb-4">Get productivity tips in your inbox</h2>
          <p className="text-xl text-taskmelt-gray mb-8">
            Weekly actionable insights to help you build better habits and get more done
          </p>
          <form className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-6 py-4 taskmelt-border text-lg"
            />
            <button
              type="submit"
              className="taskmelt-border bg-taskmelt-black text-white px-8 py-4 font-bold hover:bg-opacity-90 transition-all"
            >
              Subscribe
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
