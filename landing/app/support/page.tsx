import { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Support - taskmelt",
  description: "Get help with taskmelt via email support.",
  keywords: ["taskmelt support", "help", "customer service", "productivity app help"],
};

export default function Support() {
  return (
    <main className="min-h-screen py-20 px-6 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <Link href="/" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">
          ← Back to Home
        </Link>

        <div className="taskmelt-border bg-taskmelt-blue p-12 md:p-16">
          <Mail className="w-20 h-20 mx-auto mb-8" />
          <h1 className="text-4xl md:text-5xl font-black mb-6">Support</h1>
          <p className="text-xl text-taskmelt-gray mb-8">
            For support, please email us at:
          </p>
          <a
            href="mailto:junomobileapplications@gmail.com"
            className="text-2xl md:text-3xl font-bold hover:underline break-all"
          >
            junomobileapplications@gmail.com
          </a>
        </div>
      </div>
    </main>
  );
}
