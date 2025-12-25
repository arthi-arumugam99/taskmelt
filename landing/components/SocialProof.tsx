"use client";

import { motion } from "framer-motion";
import { Star, Users, Heart } from "lucide-react";

export default function SocialProof() {
  return (
    <section className="py-20 lg:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Rating */}
          <div className="flex justify-center items-center gap-2 mb-8">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Star className="w-12 h-12 fill-taskmelt-peach stroke-taskmelt-black stroke-2" />
              </motion.div>
            ))}
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            Join thousands finding clarity
          </h2>

          <p className="text-xl md:text-2xl text-taskmelt-gray mb-16 max-w-3xl mx-auto">
            People just like you are transforming their mental chaos into
            organized action every single day
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="taskmelt-border bg-taskmelt-pink p-8 taskmelt-shadow"
            >
              <Users className="w-12 h-12 mx-auto mb-4" />
              <div className="text-5xl font-black mb-2">10K+</div>
              <div className="text-xl text-taskmelt-gray">Active Users</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="taskmelt-border bg-taskmelt-green p-8 taskmelt-shadow"
            >
              <Heart className="w-12 h-12 mx-auto mb-4" />
              <div className="text-5xl font-black mb-2">50K+</div>
              <div className="text-xl text-taskmelt-gray">Tasks Completed</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="taskmelt-border bg-taskmelt-blue p-8 taskmelt-shadow"
            >
              <Star className="w-12 h-12 mx-auto mb-4" />
              <div className="text-5xl font-black mb-2">5.0</div>
              <div className="text-xl text-taskmelt-gray">App Store Rating</div>
            </motion.div>
          </div>

          {/* Testimonial Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-16 taskmelt-border bg-beige-light p-12 max-w-4xl mx-auto"
          >
            <p className="text-2xl md:text-3xl font-medium mb-6 italic">
              &ldquo;I&apos;ve tried every productivity app out there. taskmelt is
              the first one that actually understands how my brain works. It&apos;s
              like having a personal assistant who knows exactly what I need.&rdquo;
            </p>
            <div className="text-xl text-taskmelt-gray">— Sarah M., Product Designer</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
