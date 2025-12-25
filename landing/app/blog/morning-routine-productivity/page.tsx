import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Perfect Morning Routine for Peak Productivity in 2025",
  description: "Design a morning routine that sets you up for a productive day. Science-backed morning habits of successful people.",
  keywords: ["morning routine", "morning habits", "productive morning", "morning rituals", "wake up routine"],
};

export default function MorningRoutine() {
  return (
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
        <div className="mt-16 pt-8 border-t-4 border-taskmelt-black"><Link href="/blog" className="text-taskmelt-black font-bold text-lg hover:underline">← Back to all articles</Link></div>
      </div>
    </article>
  );
}
