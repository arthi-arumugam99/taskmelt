"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, Target, TrendingUp, Star, Zap } from "lucide-react";

export default function Gamification() {
  const achievements = [
    {
      icon: Flame,
      title: "7-Day Streak",
      description: "Complete tasks 7 days in a row",
      color: "bg-orange-100",
      iconColor: "text-orange-600",
      earned: true,
    },
    {
      icon: Trophy,
      title: "100 Tasks Done",
      description: "Crush 100 tasks total",
      color: "bg-taskmelt-yellow",
      iconColor: "text-yellow-700",
      earned: true,
    },
    {
      icon: Target,
      title: "Perfect Week",
      description: "Hit all goals for a week",
      color: "bg-taskmelt-mint",
      iconColor: "text-green-700",
      earned: false,
    },
    {
      icon: Zap,
      title: "Speed Demon",
      description: "Complete 10 tasks in one day",
      color: "bg-taskmelt-peach",
      iconColor: "text-orange-700",
      earned: false,
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
            Turn productivity into a game
          </h2>
          <p className="text-xl md:text-2xl text-taskmelt-gray">
            Stay motivated with streaks, achievements, and visual progress
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Streak Display */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="taskmelt-border bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                  <Flame className="w-10 h-10 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-orange-600 uppercase tracking-wide">
                    Current Streak
                  </div>
                  <div className="text-5xl font-black text-orange-600">
                    12 Days
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Longest Streak</span>
                  <span className="text-sm text-taskmelt-gray">21 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Tasks Completed</span>
                  <span className="text-sm text-taskmelt-gray">347 total</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Productivity Score</span>
                  <span className="text-sm text-taskmelt-gray">
                    <TrendingUp className="w-4 h-4 inline text-green-600" /> 94%
                  </span>
                </div>
              </div>

              {/* Weekly Calendar */}
              <div className="mt-6 pt-6 border-t border-orange-200">
                <div className="text-xs font-bold mb-3 text-center">
                  This Week
                </div>
                <div className="flex justify-center gap-2">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                        i < 5
                          ? "bg-orange-500 text-white"
                          : "bg-white text-taskmelt-gray"
                      }`}
                    >
                      {day}
                      {i < 5 && (
                        <Flame className="w-3 h-3 ml-1 text-yellow-300" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/70 rounded-lg text-center">
                <p className="text-sm font-bold">
                  Keep going! <span className="text-orange-600">2 more days</span> to
                  beat your record
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Achievements Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="mb-6">
              <h3 className="text-3xl font-black mb-2">Unlock Achievements</h3>
              <p className="text-taskmelt-gray">
                Hit milestones and celebrate your progress
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`taskmelt-border p-4 ${
                    achievement.earned ? achievement.color : "bg-gray-100"
                  } relative overflow-hidden`}
                >
                  {achievement.earned && (
                    <div className="absolute top-2 right-2">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    </div>
                  )}

                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      achievement.earned ? achievement.color : "bg-gray-200"
                    }`}
                  >
                    <achievement.icon
                      className={`w-6 h-6 ${
                        achievement.earned
                          ? achievement.iconColor
                          : "text-gray-400"
                      }`}
                    />
                  </div>

                  <h4
                    className={`font-black text-sm mb-1 ${
                      achievement.earned ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {achievement.title}
                  </h4>
                  <p
                    className={`text-xs ${
                      achievement.earned ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {achievement.description}
                  </p>

                  {!achievement.earned && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-300 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-taskmelt-peach h-full"
                          style={{ width: "60%" }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">60% complete</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-6 taskmelt-border bg-white p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-taskmelt-pink rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-taskmelt-black" />
                </div>
                <div>
                  <div className="font-black">Level 8 Achiever</div>
                  <div className="text-sm text-taskmelt-gray">
                    1,240 XP to Level 9
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div className="bg-taskmelt-pink h-full" style={{ width: "68%" }} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="taskmelt-border bg-gradient-to-r from-taskmelt-mint via-taskmelt-peach to-taskmelt-pink p-8 max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-black mb-4">
              Make every day count
            </h3>
            <p className="text-lg mb-6">
              Join thousands of people turning their tasks into achievements
            </p>
            <a
              href="https://apps.apple.com/in/app/taskmelt-ai-task-planner/id6756967912"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block taskmelt-border bg-taskmelt-black text-white px-10 py-4 text-lg font-bold hover:bg-opacity-90 transition-all hover:scale-105"
            >
              Start Your Streak Today
            </a>
            <p className="text-sm text-taskmelt-gray mt-4">
              Free to download • No credit card required • Premium features available
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
