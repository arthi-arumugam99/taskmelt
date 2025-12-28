import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - taskmelt",
  description: "Learn how taskmelt protects your privacy and handles your data securely.",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl md:text-6xl font-black mb-6">Privacy Policy</h1>
        <p className="text-xl text-taskmelt-gray mb-12">Last updated: December 25, 2025</p>

        <div className="space-y-8 text-lg leading-relaxed">
          <section>
            <h2 className="text-3xl font-bold mb-4">Your Privacy Matters</h2>
            <p className="text-taskmelt-gray">
              At taskmelt, we believe your thoughts and tasks are deeply personal. We're committed
              to protecting your privacy and being transparent about how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">What We Collect</h2>
            <ul className="list-disc list-inside space-y-2 text-taskmelt-gray">
              <li><strong>Account Information:</strong> Email address and display name</li>
              <li><strong>Task Data:</strong> Your brain dumps, tasks, habits, and schedules</li>
              <li><strong>Usage Data:</strong> App interactions and feature usage</li>
              <li><strong>Device Information:</strong> Device type, OS version, app version</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-taskmelt-gray">
              <li><strong>AI Processing:</strong> To transform your brain dumps into organized tasks</li>
              <li><strong>Sync:</strong> To sync your data across your devices</li>
              <li><strong>Improvements:</strong> To improve our AI and app features</li>
              <li><strong>Support:</strong> To provide customer support when you need help</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Data Security</h2>
            <p className="text-taskmelt-gray mb-4">
              We use industry-standard encryption to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-taskmelt-gray">
              <li>End-to-end encryption for data in transit (TLS/SSL)</li>
              <li>Encrypted storage for data at rest</li>
              <li>Secure authentication with Supabase</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Your Rights</h2>
            <p className="text-taskmelt-gray mb-4">You have complete control over your data:</p>
            <ul className="list-disc list-inside space-y-2 text-taskmelt-gray">
              <li><strong>Access:</strong> Export all your data anytime</li>
              <li><strong>Delete:</strong> Delete your account and all data permanently</li>
              <li><strong>Modify:</strong> Edit or update your information</li>
              <li><strong>Opt-out:</strong> Disable analytics and data collection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Third-Party Services</h2>
            <p className="text-taskmelt-gray mb-4">We use trusted third-party services:</p>
            <ul className="list-disc list-inside space-y-2 text-taskmelt-gray">
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>RevenueCat:</strong> In-app purchases and subscriptions</li>
              <li><strong>OpenAI:</strong> AI processing (anonymized data only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-taskmelt-gray">
              Questions about privacy? Email us at{" "}
              <a href="mailto:junomobileapplications@gmail.com" className="text-taskmelt-black font-bold hover:underline">
                junomobileapplications@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
