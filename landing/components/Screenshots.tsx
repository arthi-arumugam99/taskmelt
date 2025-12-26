"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const screenshots = [
  { src: "/screenshots/IMG_4366.jpeg", alt: "Brain Dump" },
  { src: "/screenshots/IMG_4369.jpeg", alt: "AI-Organized Tasks" },
  { src: "/screenshots/IMG_4373.jpeg", alt: "Habit Tracker" },
  { src: "/screenshots/IMG_4372.jpeg", alt: "No Zero Days Tracker" },
  { src: "/screenshots/IMG_4367.jpeg", alt: "Detailed Task View" },
  { src: "/screenshots/IMG_4374.jpeg", alt: "Insights & Analytics" },
];

export default function Screenshots() {
  return (
    <section className="py-20 lg:py-32 bg-beige-light">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
            See it in action
          </h2>
          <p className="text-xl md:text-2xl text-taskmelt-gray max-w-2xl mx-auto">
            A glimpse into your future organized life
          </p>
        </motion.div>

        {/* Screenshots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {screenshots.map((screenshot, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="taskmelt-border bg-white p-3 taskmelt-shadow cursor-pointer hover:translate-x-1 hover:translate-y-1 transition-transform"
            >
              <Image
                src={screenshot.src}
                alt={screenshot.alt}
                width={400}
                height={867}
                className="w-full h-auto rounded-2xl"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
