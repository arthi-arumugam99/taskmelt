import { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, Mail, MessageCircle, Book } from "lucide-react";

export const metadata: Metadata = {
  title: "Support & Help Center - taskmelt",
  description: "Get help with taskmelt. FAQs, guides, and contact support.",
  keywords: ["taskmelt support", "help", "faq", "customer service", "productivity app help"],
};

export default function Support() {
  const faqs = [
    {
      question: "How does the brain dump feature work?",
      answer: "Simply type or speak everything on your mind into the brain dump area. Our AI analyzes your thoughts and automatically organizes them into actionable tasks with time estimates and priorities."
    },
    {
      question: "Can I use taskmelt offline?",
      answer: "Yes! taskmelt works offline. Your data syncs automatically when you're back online."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "Cancel anytime through your App Store (iOS) or Google Play (Android) subscription settings. You'll keep premium features until the end of your billing period."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use end-to-end encryption and never share your personal data. Your thoughts and tasks are private and secure."
    },
    {
      question: "Can I export my data?",
      answer: "Yes! Export all your tasks, habits, and data anytime from Settings → Export Data."
    },
    {
      question: "How does AI task organization work?",
      answer: "Our AI understands natural language and context. It identifies tasks, priorities, time estimates, and categories from your brain dump automatically."
    },
  ];

  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl md:text-6xl font-black mb-6">Support & Help Center</h1>
        <p className="text-xl text-taskmelt-gray mb-16">
          We're here to help you get the most out of taskmelt
        </p>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="taskmelt-border bg-taskmelt-blue p-8 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Email Support</h3>
            <p className="text-taskmelt-gray mb-4">We respond within 24 hours</p>
            <a href="mailto:support@taskmelt.com" className="font-bold hover:underline">
              support@taskmelt.com
            </a>
          </div>

          <div className="taskmelt-border bg-taskmelt-pink p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Live Chat</h3>
            <p className="text-taskmelt-gray mb-4">Mon-Fri, 9am-5pm EST</p>
            <button className="font-bold hover:underline">Start Chat</button>
          </div>

          <div className="taskmelt-border bg-taskmelt-green p-8 text-center">
            <Book className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Documentation</h3>
            <p className="text-taskmelt-gray mb-4">Guides and tutorials</p>
            <Link href="/blog" className="font-bold hover:underline">
              Browse Guides
            </Link>
          </div>
        </div>

        {/* FAQs */}
        <section>
          <h2 className="text-4xl md:text-5xl font-black mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="taskmelt-border bg-beige-light p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                  {faq.question}
                </h3>
                <p className="text-lg text-taskmelt-gray pl-9">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Still need help */}
        <section className="mt-20 text-center taskmelt-border bg-taskmelt-peach p-12">
          <h2 className="text-3xl font-black mb-4">Still need help?</h2>
          <p className="text-xl text-taskmelt-gray mb-6">
            Our support team is ready to assist you
          </p>
          <a
            href="mailto:support@taskmelt.com"
            className="inline-block taskmelt-border bg-taskmelt-black text-white px-10 py-4 text-xl font-bold hover:bg-opacity-90 transition-all"
          >
            Contact Support
          </a>
        </section>
      </div>
    </main>
  );
}
