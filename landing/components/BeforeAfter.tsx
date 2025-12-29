"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export default function BeforeAfter() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-beige-dark to-beige">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            Your transformation starts here
          </h2>
          <p className="text-xl md:text-2xl text-taskmelt-gray">
            See the shift you'll experience with taskmelt
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* BEFORE */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="taskmelt-border bg-white p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black">Before taskmelt</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                <span className="text-lg text-taskmelt-gray">
                  Overwhelmed by racing thoughts and scattered to-dos
                </span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                <span className="text-lg text-taskmelt-gray">
                  Spending hours organizing instead of doing
                </span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                <span className="text-lg text-taskmelt-gray">
                  Forgetting important tasks hidden in notes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                <span className="text-lg text-taskmelt-gray">
                  Feeling stressed about unclear priorities
                </span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                <span className="text-lg text-taskmelt-gray">
                  Juggling multiple apps that don't talk to each other
                </span>
              </li>
            </ul>
          </motion.div>

          {/* AFTER */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="taskmelt-border bg-taskmelt-mint p-8 relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black">After taskmelt</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-lg">
                    <strong>Clear mind:</strong> Dump everything and relax
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-lg">
                    <strong>AI organizes for you:</strong> No manual sorting needed
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-lg">
                    <strong>Time-blocked schedule:</strong> Know exactly what to do when
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-lg">
                    <strong>Focus on what matters:</strong> AI prioritizes automatically
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-lg">
                    <strong>All in one place:</strong> Tasks + habits + calendar synced
                  </span>
                </li>
              </ul>

              <div className="mt-8 p-4 bg-white/50 rounded-lg taskmelt-border">
                <p className="text-sm font-bold text-center">
                  ⚡ Average time to feel organized: <span className="text-taskmelt-peach">under 5 minutes</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Social Proof Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-taskmelt-peach mb-2">
              10K+
            </div>
            <div className="text-sm md:text-base text-taskmelt-gray">
              Users trust taskmelt
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-taskmelt-mint mb-2">
              5 min
            </div>
            <div className="text-sm md:text-base text-taskmelt-gray">
              To organized clarity
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-taskmelt-pink mb-2">
              4.8★
            </div>
            <div className="text-sm md:text-base text-taskmelt-gray">
              App Store rating
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
