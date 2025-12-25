import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - taskmelt",
  description: "Terms and conditions for using the taskmelt productivity app.",
};

export default function Terms() {
  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl md:text-6xl font-black mb-6">Terms of Service</h1>
        <p className="text-xl text-taskmelt-gray mb-12">Last updated: December 25, 2025</p>

        <div className="space-y-8 text-lg leading-relaxed">
          <section>
            <h2 className="text-3xl font-bold mb-4">Agreement to Terms</h2>
            <p className="text-taskmelt-gray">
              By using taskmelt, you agree to these terms. If you don't agree, please don't use our app.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Use License</h2>
            <p className="text-taskmelt-gray mb-4">
              We grant you a personal, non-transferable license to use taskmelt for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-taskmelt-gray">
              <li>Personal productivity and task management</li>
              <li>Habit tracking and goal setting</li>
              <li>Brain dumping and mental organization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Acceptable Use</h2>
            <p className="text-taskmelt-gray mb-4">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-taskmelt-gray">
              <li>Reverse engineer or decompile the app</li>
              <li>Use the app for illegal purposes</li>
              <li>Share your account with others</li>
              <li>Abuse our AI features or servers</li>
              <li>Spam or harass other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Subscriptions & Payments</h2>
            <p className="text-taskmelt-gray mb-4">
              Premium features require a subscription:
            </p>
            <ul className="list-disc list-inside space-y-2 text-taskmelt-gray">
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>Cancel anytime through the App Store or Google Play</li>
              <li>Refunds handled according to App Store/Google Play policies</li>
              <li>Prices may change with 30 days notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Intellectual Property</h2>
            <p className="text-taskmelt-gray">
              taskmelt owns all rights to the app, design, and AI technology. Your content remains yours,
              but you grant us license to process it to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Disclaimer</h2>
            <p className="text-taskmelt-gray">
              taskmelt is provided "as is" without warranties. We strive for 99.9% uptime but can't
              guarantee uninterrupted service. We're not liable for lost data (though we backup regularly).
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Changes to Terms</h2>
            <p className="text-taskmelt-gray">
              We may update these terms. Continued use after changes means you accept the new terms.
              We'll notify you of significant changes via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Contact</h2>
            <p className="text-taskmelt-gray">
              Questions? Email{" "}
              <a href="mailto:legal@taskmelt.com" className="text-taskmelt-black font-bold hover:underline">
                legal@taskmelt.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
