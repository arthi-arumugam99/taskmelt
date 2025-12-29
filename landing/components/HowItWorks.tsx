"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Calendar, Smile } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Brain,
      title: "Brain Dump Everything",
      description: "Just type or speak whatever's on your mind. No structure needed—tasks, ideas, worries, random thoughts. Get it ALL out.",
      emotion: "Relief",
      color: "bg-taskmelt-mint",
      textColor: "text-taskmelt-mint",
    },
    {
      icon: Sparkles,
      title: "AI Organizes for You",
      description: "Our AI reads your dump, identifies tasks, extracts deadlines, sets priorities, and creates categories. Zero manual work.",
      emotion: "Magic",
      color: "bg-taskmelt-yellow",
      textColor: "text-taskmelt-yellow",
    },
    {
      icon: Calendar,
      title: "Get Your Perfect Schedule",
      description: "AI creates time-blocked slots for each task, syncs with your calendar, and sets smart reminders. Your day is ready.",
      emotion: "Clarity",
      color: "bg-taskmelt-peach",
      textColor: "text-taskmelt-peach",
    },
    {
      icon: Smile,
      title: "Focus & Get Things Done",
      description: "Follow your schedule, check off tasks, track habits, and watch your productivity soar. Feel accomplished every day.",
      emotion: "Achievement",
      color: "bg-taskmelt-pink",
      textColor: "text-taskmelt-pink",
    },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            From chaos to clarity in 4 simple steps
          </h2>
          <p className="text-xl md:text-2xl text-taskmelt-gray">
            The easiest way to organize your life
          </p>
        </motion.div>

        <div className="grid gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col md:flex-row gap-6 taskmelt-border bg-beige p-8 items-center hover:scale-[1.02] transition-transform"
            >
              {/* Step number & icon */}
              <div className="flex-shrink-0">
                <div className={`relative w-24 h-24 ${step.color} rounded-full flex items-center justify-center`}>
                  <step.icon className="w-12 h-12 text-taskmelt-black" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-taskmelt-black text-white rounded-full flex items-center justify-center text-xl font-black">
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black mb-2">
                  {step.title}
                </h3>
                <p className="text-lg text-taskmelt-gray mb-3">
                  {step.description}
                </p>
                <div className={`inline-block px-4 py-2 rounded-full ${step.color} font-bold text-sm`}>
                  😌 You'll feel: {step.emotion}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Time to result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-block taskmelt-border bg-taskmelt-mint p-8 max-w-md">
            <div className="text-5xl font-black mb-2">⏱️ Under 5 Minutes</div>
            <p className="text-xl text-taskmelt-gray">
              From your first brain dump to a fully organized day
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
