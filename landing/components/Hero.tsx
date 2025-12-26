"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-beige via-beige to-beige-dark -z-10" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto text-center"
      >
        {/* Logo/Wordmark */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-6"
        >
          task<span className="italic">melt</span>
        </motion.h1>

        {/* Tagline */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-3xl md:text-4xl lg:text-5xl text-taskmelt-gray font-bold mb-12"
        >
          Chaos in. Clarity out.
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg md:text-xl lg:text-2xl text-taskmelt-gray max-w-3xl mx-auto mb-12 text-balance"
        >
          Transform your mental chaos into organized tasks. Brain dump everything
          swirling in your head, and let AI create your perfect schedule.
        </motion.p>

        {/* CTA Button */}
        <motion.a
          href="#download"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="inline-block taskmelt-border bg-taskmelt-peach px-12 py-6 text-xl md:text-2xl font-bold hover:bg-opacity-90 transition-all hover:scale-105 taskmelt-shadow"
        >
          Download for iPhone
        </motion.a>

        {/* Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 relative mx-auto max-w-sm"
        >
          <div className="taskmelt-border bg-white p-2 taskmelt-shadow">
            <Image
              src="/screenshots/IMG_4366.jpeg"
              alt="taskmelt brain dump interface"
              width={400}
              height={867}
              className="w-full h-auto rounded-2xl"
              priority
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-taskmelt-gray" />
        </motion.div>
      </motion.div>
    </section>
  );
}
