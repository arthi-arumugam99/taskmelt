"use client";

import { motion } from "framer-motion";
import { Shield, Clock, Users, Award } from "lucide-react";

export default function TrustSignals() {
  const trustElements = [
    {
      icon: Shield,
      title: "Your data is private",
      description: "Bank-level encryption. No log-in required. Ad-free forever.",
      color: "bg-taskmelt-mint",
    },
    {
      icon: Clock,
      title: "Results in minutes",
      description: "First brain dump to organized schedule: under 5 minutes",
      color: "bg-taskmelt-peach",
    },
    {
      icon: Users,
      title: "Join 10,000+ users",
      description: "Productive people worldwide use taskmelt daily",
      color: "bg-taskmelt-pink",
    },
    {
      icon: Award,
      title: "4.8★ rated",
      description: "Loved by users for simplicity and effectiveness",
      color: "bg-taskmelt-yellow",
    },
  ];

  return (
    <section className="py-16 px-6 bg-beige">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustElements.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="taskmelt-border bg-white p-6 text-center hover:scale-105 transition-transform"
            >
              <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <item.icon className="w-8 h-8 text-taskmelt-black" />
              </div>
              <h3 className="font-black text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-taskmelt-gray">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
