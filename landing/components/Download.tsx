"use client";

import { motion } from "framer-motion";
import { Apple } from "lucide-react";

export default function Download() {
  return (
    <section id="download" className="py-20 lg:py-32 px-6 bg-taskmelt-peach">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8">
            Start melting your
            <br />
            chaos today
          </h2>

          <p className="text-xl md:text-2xl text-taskmelt-gray mb-12 max-w-2xl mx-auto">
            Download taskmelt and experience the relief of turning mental
            overwhelm into organized clarity
          </p>

          {/* Download Button */}
          <div className="flex flex-col gap-6 justify-center items-center mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="taskmelt-border bg-taskmelt-black text-white px-10 py-6 text-xl font-bold flex items-center gap-3 taskmelt-shadow"
            >
              <Apple className="w-8 h-8" />
              Coming Soon to App Store
            </motion.div>
            <p className="text-taskmelt-gray text-sm">
              Available exclusively on iPhone
            </p>
          </div>

          <p className="text-lg text-taskmelt-gray">
            Free to download. Premium features available.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
