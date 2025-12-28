import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Screenshots from "@/components/Screenshots";
import SocialProof from "@/components/SocialProof";
import Download from "@/components/Download";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";
import { generateOrganizationSchema, generateWebApplicationSchema } from "@/lib/structured-data";
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

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={webAppSchema} />
      <main className="overflow-x-hidden">
        <Hero />
        <Features />
        <Screenshots />
        <SocialProof />
        <Download />
        <Footer />
      </main>
    </>
  );
}
