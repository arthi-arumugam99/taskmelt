"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="taskmelt-border bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex justify-between items-center text-left hover:bg-taskmelt-peach transition-colors"
      >
        <h3 className="text-xl font-bold pr-8">{question}</h3>
        <ChevronDown
          className={`w-6 h-6 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-8 pb-6 text-lg text-taskmelt-gray leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const faqs = [
    {
      question: "What is taskmelt?",
      answer:
        "taskmelt is an AI-powered productivity app that helps you transform mental chaos into organized tasks. Simply brain dump everything on your mind, and our AI automatically creates a structured schedule with time blocks, priorities, and reminders. It's like having a personal assistant that understands how you think.",
    },
    {
      question: "How is taskmelt different from other to-do apps?",
      answer:
        "Unlike traditional task managers that require you to organize before you capture, taskmelt lets you dump your thoughts in any format—voice notes, rambling text, scattered ideas—and our AI does the organizing for you. We also integrate habit tracking, calendar scheduling, and intelligent prioritization in one seamless experience.",
    },
    {
      question: "Is taskmelt free?",
      answer:
        "Yes! taskmelt offers a generous free plan that includes core features like brain dumps, task management, and basic habit tracking. Our premium plan unlocks unlimited brain dumps, advanced AI scheduling, calendar integrations, and priority support.",
    },
    {
      question: "What platforms does taskmelt work on?",
      answer:
        "taskmelt is available on iOS, Android, and web browsers. All your data syncs seamlessly across all devices, so you can capture ideas on your phone and review them on your computer.",
    },
    {
      question: "How does the AI brain dump feature work?",
      answer:
        "Simply type or speak everything on your mind into taskmelt—tasks, ideas, worries, random thoughts—without any structure. Our AI reads your input, identifies actionable tasks, extracts deadlines and priorities, categorizes items, and creates an organized schedule with time blocks. It takes 10 seconds to dump, and you get back a perfectly structured day.",
    },
    {
      question: "Can I integrate taskmelt with my calendar?",
      answer:
        "Yes! taskmelt integrates with Google Calendar, Apple Calendar, and Outlook. Your scheduled time blocks automatically sync to your calendar, and you can see all your commitments in one place.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. We use bank-level encryption to protect your data, both in transit and at rest. Your information is stored securely and never shared with third parties. You can delete your account and all associated data at any time.",
    },
    {
      question: "Can I try taskmelt before committing?",
      answer:
        "Yes! Download taskmelt and start using it for free. No credit card required. Try the brain dump feature, task management, and habit tracking to see if it works for you. You can upgrade to premium anytime if you want more features.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-taskmelt-peach">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-taskmelt-gray">
            Everything you need to know about taskmelt
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-taskmelt-gray mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:junomobileapplications@gmail.com"
            className="inline-block taskmelt-border bg-taskmelt-black text-white px-8 py-4 font-bold hover:bg-opacity-90 transition-all"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
