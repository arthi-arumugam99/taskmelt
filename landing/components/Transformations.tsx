"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";

export default function Transformations() {
  const transformations = [
    {
      name: "Sarah M.",
      role: "Product Manager",
      before: "Drowning in 47 browser tabs and 3 different to-do apps",
      after: "Brain dumps once in the morning, organized for the entire day",
      metric: "Saved 2 hours daily",
      image: "/avatars/avatar-1.png",
    },
    {
      name: "David K.",
      role: "Entrepreneur",
      before: "Felt paralyzed by overwhelming task lists",
      after: "AI breaks everything into clear, achievable time blocks",
      metric: "2x productivity",
      image: "/avatars/avatar-2.png",
    },
    {
      name: "Emma L.",
      role: "Graduate Student",
      before: "Constant anxiety about forgetting important deadlines",
      after: "Dumps everything in taskmelt, never misses a thing",
      metric: "Zero stress",
      image: "/avatars/avatar-3.png",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-beige to-beige-dark">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            Real people. Real transformations.
          </h2>
          <p className="text-xl md:text-2xl text-taskmelt-gray">
            See how taskmelt changed their productivity game
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {transformations.map((story, index) => (
            <motion.div
              key={story.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="taskmelt-border bg-white p-6"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-taskmelt-yellow text-taskmelt-yellow" />
                ))}
              </div>

              {/* Before/After */}
              <div className="mb-6">
                <div className="mb-4">
                  <div className="text-xs font-bold text-red-600 mb-1">BEFORE</div>
                  <p className="text-sm text-taskmelt-gray italic">
                    "{story.before}"
                  </p>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-bold text-green-600 mb-1">AFTER</div>
                  <p className="text-sm italic">
                    "{story.after}"
                  </p>
                </div>
              </div>

              {/* Metric */}
              <div className="mb-6 p-4 bg-taskmelt-mint rounded-lg text-center">
                <div className="text-2xl font-black text-taskmelt-black">
                  {story.metric}
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-taskmelt-peach flex items-center justify-center font-black text-xl">
                  {story.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{story.name}</div>
                  <div className="text-sm text-taskmelt-gray">{story.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA after testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-2xl font-bold mb-6">
            Your transformation is waiting
          </p>
          <a
            href="https://apps.apple.com/in/app/taskmelt-ai-task-planner/id6756967912"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block taskmelt-border bg-taskmelt-black text-white px-12 py-6 text-xl font-bold hover:bg-opacity-90 transition-all hover:scale-105"
          >
            Download taskmelt Free
          </a>
          <p className="text-sm text-taskmelt-gray mt-4">
            Free features included • No credit card required • Premium upgrade available
          </p>
        </motion.div>
      </div>
    </section>
  );
}
