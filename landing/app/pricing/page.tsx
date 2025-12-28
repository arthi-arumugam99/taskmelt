import { Metadata } from "next";
import Link from "next/link";
import { Check, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing - taskmelt | Simple, Transparent Pricing for AI Task Management",
  description: "Choose the perfect plan for your productivity needs. Start free with taskmelt's AI task manager. Upgrade anytime for unlimited features.",
  keywords: ["taskmelt pricing", "productivity app pricing", "task management pricing", "free productivity app", "AI task manager pricing"],
  openGraph: {
    title: "taskmelt Pricing | Simple, Transparent Plans",
    description: "Start free with taskmelt's AI task manager. Upgrade anytime for unlimited features.",
    url: "https://taskmelt.app/pricing",
    siteName: "taskmelt",
    images: [
      {
        url: "https://taskmelt.app/icon.png",
        width: 512,
        height: 512,
        alt: "taskmelt Pricing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "taskmelt Pricing | Simple, Transparent Plans",
    description: "Start free with taskmelt's AI task manager. Upgrade anytime for unlimited features.",
    images: ["https://taskmelt.app/icon.png"],
  },
  alternates: {
    canonical: "https://taskmelt.app/pricing",
  },
};

export default function Pricing() {
  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">
          ← Back to Home
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl md:text-2xl text-taskmelt-gray max-w-2xl mx-auto">
            Start free. Upgrade when you're ready for unlimited chaos-melting power.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="taskmelt-border bg-white p-10">
            <h2 className="text-3xl font-black mb-4">Free</h2>
            <div className="mb-6">
              <span className="text-5xl font-black">$0</span>
              <span className="text-2xl text-taskmelt-gray">/forever</span>
            </div>
            <p className="text-lg text-taskmelt-gray mb-8">
              Perfect for getting started with brain dumping and task management
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>3 brain dumps per month</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Unlimited manual tasks</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>5 daily habits</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Basic calendar view</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Sync across devices</span>
              </li>
            </ul>

            <a
              href="#download"
              className="block w-full text-center taskmelt-border bg-beige-light px-8 py-4 text-xl font-bold hover:bg-beige-dark transition-all"
            >
              Download Free
            </a>
          </div>

          {/* Pro Plan */}
          <div className="taskmelt-border bg-taskmelt-peach p-10 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 taskmelt-border bg-taskmelt-black text-white px-6 py-2 text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              MOST POPULAR
            </div>

            <h2 className="text-3xl font-black mb-4">Pro</h2>
            <div className="mb-6">
              <span className="text-5xl font-black">$6.99</span>
              <span className="text-2xl text-taskmelt-gray">/month</span>
            </div>
            <p className="text-lg text-taskmelt-gray mb-8">
              Unlimited everything. Maximum productivity.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="font-bold">Unlimited brain dumps</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="font-bold">Advanced AI organization</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="font-bold">Unlimited habits</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Voice-to-text input</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Advanced insights & analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Custom categories & tags</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>Calendar integrations</span>
              </li>
            </ul>

            <a
              href="#download"
              className="block w-full text-center taskmelt-border bg-taskmelt-black text-white px-8 py-4 text-xl font-bold hover:bg-opacity-90 transition-all taskmelt-shadow"
            >
              Start Free Trial
            </a>
            <p className="text-center text-sm text-taskmelt-gray mt-4">
              7-day free trial. Cancel anytime.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-4xl font-black mb-12 text-center">Pricing FAQs</h2>

          <div className="space-y-6">
            <div className="taskmelt-border bg-beige-light p-6">
              <h3 className="text-xl font-bold mb-2">Can I switch plans anytime?</h3>
              <p className="text-taskmelt-gray">
                Yes! Upgrade or downgrade anytime. Changes take effect immediately.
              </p>
            </div>

            <div className="taskmelt-border bg-beige-light p-6">
              <h3 className="text-xl font-bold mb-2">Is there a lifetime option?</h3>
              <p className="text-taskmelt-gray">
                Yes! Get lifetime Pro access for a one-time payment. Check in-app for current pricing.
              </p>
            </div>

            <div className="taskmelt-border bg-beige-light p-6">
              <h3 className="text-xl font-bold mb-2">What payment methods do you accept?</h3>
              <p className="text-taskmelt-gray">
                All payments through App Store or Google Play. We accept credit cards, PayPal, and more.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
