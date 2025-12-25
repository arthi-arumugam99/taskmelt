"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Sparkles, ListTodo, Calendar, TrendingUp, Mic } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  reverse?: boolean;
}

const features: Feature[] = [
  {
    title: "Brain Dump Everything",
    description: "Type or speak everything on your mind—tasks, ideas, worries, random thoughts. No need to organize, just dump it all out. Use voice input for hands-free capture.",
    image: "/screenshots/brain-dump.jpeg",
    icon: <Brain className="w-12 h-12" />,
  },
  {
    title: "AI Transforms Chaos into Clarity",
    description: "Our AI understands your brain dump and automatically organizes it into actionable tasks with time estimates, priorities, and smart scheduling.",
    image: "/screenshots/tasks.jpeg",
    icon: <Sparkles className="w-12 h-12" />,
    reverse: true,
  },
  {
    title: "Time-Blocked Task Management",
    description: "See your day at a glance with time-blocked tasks. Add subtasks, set reminders, organize by category, and track progress effortlessly.",
    image: "/screenshots/day-view.jpeg",
    icon: <ListTodo className="w-12 h-12" />,
  },
  {
    title: "Build Lasting Habits",
    description: "Track daily habits with visual streaks. No more zero days—do at least one thing towards your goals every single day, no matter how small.",
    image: "/screenshots/habits.jpeg",
    icon: <Calendar className="w-12 h-12" />,
    reverse: true,
  },
  {
    title: "Visualize Your Progress",
    description: "See your productivity journey with calendar views and insights. Track completion rates, identify patterns, and celebrate your wins.",
    image: "/screenshots/tracker.png",
    icon: <TrendingUp className="w-12 h-12" />,
  },
];

function FeatureCard({ title, description, image, icon, reverse }: Feature) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-20 mb-32`}
    >
      {/* Image */}
      <div className="flex-1 w-full max-w-md lg:max-w-none">
        <div className="taskmelt-border bg-white p-3 taskmelt-shadow hover:translate-x-1 hover:translate-y-1 transition-transform">
          <Image
            src={image}
            alt={title}
            width={400}
            height={867}
            className="w-full h-auto rounded-2xl"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">
        <div className="inline-block taskmelt-border bg-taskmelt-blue p-4">
          {icon}
        </div>
        <h3 className="text-4xl md:text-5xl lg:text-6xl font-black">
          {title}
        </h3>
        <p className="text-xl md:text-2xl text-taskmelt-gray leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section className="py-20 lg:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
            Everything you need to
            <br />
            <span className="bg-taskmelt-green px-4 py-2 inline-block taskmelt-border mt-2">
              melt your chaos
            </span>
          </h2>
        </motion.div>

        {/* Features */}
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </section>
  );
}
