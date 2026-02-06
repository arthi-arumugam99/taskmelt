import { Metadata } from "next";
import Link from "next/link";
import { Heart, Zap, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About taskmelt - Our Mission to End Productivity Overwhelm",
  description: "Learn about taskmelt's mission to help people transform mental chaos into clarity through AI-powered task management. Chaos in. Clarity out.",
  keywords: ["about taskmelt", "productivity app", "task management", "our mission", "company story", "AI task manager"],
  openGraph: {
    title: "About taskmelt - Our Mission to End Productivity Overwhelm",
    description: "Learn about taskmelt's mission to help people transform mental chaos into clarity through AI-powered task management.",
    url: "https://taskmelt.app/about",
    siteName: "taskmelt",
    images: [
      {
        url: "https://taskmelt.app/icon.png",
        width: 512,
        height: 512,
        alt: "About taskmelt",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About taskmelt - Our Mission to End Productivity Overwhelm",
    description: "Learn about taskmelt's mission to transform mental chaos into clarity.",
    images: ["https://taskmelt.app/icon.png"],
  },
  alternates: {
    canonical: "https://taskmelt.app/about",
  },
};

export default function About() {
  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl md:text-6xl font-black mb-12">
          We're on a mission to end
          <br />
          productivity overwhelm
        </h1>

        <div className="space-y-12 text-lg leading-relaxed">
          <section>
            <h2 className="text-3xl font-bold mb-4">The Problem We're Solving</h2>
            <p className="text-taskmelt-gray mb-4">
              Most productivity apps make you more stressed, not less. They force you to organize your thoughts
              before you even capture them. They demand structure when your mind is chaos.
            </p>
            <p className="text-taskmelt-gray">
              We built taskmelt because we were tired of feeling overwhelmed by our own to-do lists. We wanted
              an app that meets you where you are—in the mess—and helps you find clarity.
            </p>
          </section>

          <section className="taskmelt-border bg-taskmelt-blue p-10">
            <h2 className="text-4xl font-black mb-6">Our Philosophy</h2>
            <p className="text-2xl font-bold mb-4">Chaos in. Clarity out.</p>
            <p className="text-taskmelt-gray">
              Your brain is for having ideas, not storing them. Dump everything into taskmelt—messy, unorganized,
              stream-of-consciousness. Our AI does the hard work of turning that chaos into an actionable,
              time-blocked schedule.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">What Makes Us Different</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="taskmelt-border bg-beige-light p-6 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">AI-First</h3>
                <p className="text-taskmelt-gray">
                  We use AI to do the boring work of organizing, categorizing, and scheduling your tasks.
                </p>
              </div>

              <div className="taskmelt-border bg-beige-light p-6 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Human-Centered</h3>
                <p className="text-taskmelt-gray">
                  Built for how real humans think—messy, nonlinear, and overwhelmed sometimes.
                </p>
              </div>

              <div className="taskmelt-border bg-beige-light p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Community-Driven</h3>
                <p className="text-taskmelt-gray">
                  Every feature is built based on feedback from real users struggling with real problems.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Our Commitment to You</h2>
            <ul className="space-y-3 text-taskmelt-gray">
              <li className="flex items-start gap-3">
                <span className="text-2xl">🔒</span>
                <span><strong>Privacy-first:</strong> Your thoughts are private. We encrypt everything and never sell your data.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <span><strong>Fast & reliable:</strong> We obsess over speed. Capturing a thought should take seconds, not minutes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">💪</span>
                <span><strong>Always improving:</strong> We ship updates weekly based on your feedback.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">❤️</span>
                <span><strong>Support that cares:</strong> Real humans respond to your questions within 24 hours.</span>
              </li>
            </ul>
          </section>

          <section className="taskmelt-border bg-taskmelt-peach p-10 text-center">
            <h2 className="text-3xl font-black mb-4">Join Thousands Finding Clarity</h2>
            <p className="text-xl text-taskmelt-gray mb-8">
              Experience the relief of dumping your mental chaos and getting back organized clarity.
            </p>
            <a
              href="https://apps.apple.com/in/app/taskmelt-ai-task-planner/id6756967912"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block taskmelt-border bg-taskmelt-black text-white px-10 py-4 text-xl font-bold hover:bg-opacity-90 transition-all"
            >
              Download Free
            </a>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-taskmelt-gray mb-4">
              We'd love to hear from you. Questions, feedback, or just want to say hi?
            </p>
            <p>
              <a href="mailto:junomobileapplications@gmail.com" className="text-taskmelt-black font-bold text-xl hover:underline">
                junomobileapplications@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
