import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Screenshots from "@/components/Screenshots";
import SocialProof from "@/components/SocialProof";
import Download from "@/components/Download";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";
import { generateOrganizationSchema, generateWebApplicationSchema, generateFAQSchema } from "@/lib/structured-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "taskmelt - AI Task Manager | Brain Dump App for Productivity",
  description: "Transform your mental chaos into organized tasks with AI. Brain dump everything and let taskmelt create your perfect schedule. The productivity app that thinks like you do.",
  keywords: ["AI task manager", "brain dump app", "productivity app", "habit tracker", "AI scheduling", "task management", "mental clarity", "productivity tool"],
  openGraph: {
    title: "taskmelt - AI Task Manager | Brain Dump App",
    description: "Transform your mental chaos into organized tasks with AI. Brain dump everything and let taskmelt create your perfect schedule.",
    url: "https://taskmelt.app",
    siteName: "taskmelt",
    images: [
      {
        url: "https://taskmelt.app/icon.png",
        width: 512,
        height: 512,
        alt: "taskmelt - AI Task Manager",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "taskmelt - AI Task Manager | Brain Dump App",
    description: "Transform your mental chaos into organized tasks with AI.",
    images: ["https://taskmelt.app/icon.png"],
  },
  alternates: {
    canonical: "https://taskmelt.app",
  },
};

export default function Home() {
  const organizationSchema = generateOrganizationSchema();
  const webAppSchema = generateWebApplicationSchema();
  const faqSchema = generateFAQSchema([
    {
      question: "What is taskmelt?",
      answer: "taskmelt is an AI-powered productivity app that helps you transform mental chaos into organized tasks. Simply brain dump everything on your mind, and our AI automatically creates a structured schedule with time blocks, priorities, and reminders.",
    },
    {
      question: "How is taskmelt different from other to-do apps?",
      answer: "Unlike traditional task managers that require you to organize before you capture, taskmelt lets you dump your thoughts in any format—voice notes, rambling text, scattered ideas—and our AI does the organizing for you. We also integrate habit tracking, calendar scheduling, and intelligent prioritization in one seamless experience.",
    },
    {
      question: "Is taskmelt free?",
      answer: "Yes! taskmelt offers a generous free plan that includes core features like brain dumps, task management, and basic habit tracking. Our premium plan unlocks unlimited brain dumps, advanced AI scheduling, calendar integrations, and priority support.",
    },
    {
      question: "What platforms does taskmelt work on?",
      answer: "taskmelt is available on iOS, Android, and web browsers. All your data syncs seamlessly across all devices.",
    },
    {
      question: "How does the AI brain dump feature work?",
      answer: "Simply type or speak everything on your mind into taskmelt—tasks, ideas, worries, random thoughts—without any structure. Our AI reads your input, identifies actionable tasks, extracts deadlines and priorities, categorizes items, and creates an organized schedule with time blocks.",
    },
    {
      question: "Can I integrate taskmelt with my calendar?",
      answer: "Yes! taskmelt integrates with Google Calendar, Apple Calendar, and Outlook. Your scheduled time blocks automatically sync to your calendar.",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level encryption to protect your data, both in transit and at rest. Your information is stored securely and never shared with third parties.",
    },
    {
      question: "Can I try taskmelt before committing?",
      answer: "Yes! Download taskmelt and start using it for free. No credit card required. Try the brain dump feature, task management, and habit tracking to see if it works for you.",
    },
  ]);

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={webAppSchema} />
      <StructuredData data={faqSchema} />
      <main className="overflow-x-hidden">
        <Hero />
        <Features />
        <Screenshots />
        <SocialProof />
        <FAQ />
        <Download />
        <Footer />
      </main>
    </>
  );
}
