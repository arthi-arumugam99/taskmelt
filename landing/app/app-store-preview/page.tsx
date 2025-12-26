"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const screenshots = [
  {
    id: 1,
    image: "/screenshots/brain-dump.jpeg",
    title: "Dump everything on your mind",
    subtitle: "Type or speak. No organizing needed.",
    description: "AI instantly transforms your chaos into a clear, actionable schedule",
    gradient: "from-black/80 via-black/0 to-black/90",
    titleColor: "text-white",
    accentColor: "text-[#FFD4A8]",
  },
  {
    id: 2,
    image: "/screenshots/tasks.jpeg",
    title: "Chaos in.",
    titleAccent: "Clarity out.",
    description: "Smart time estimates • Auto-scheduling • Subtasks",
    subdescription: "All organized in seconds",
    gradient: "from-black/75 via-black/0 to-black/95",
    titleColor: "text-white",
    accentColor: "text-[#FFD4A8]",
  },
  {
    id: 3,
    image: "/screenshots/habits.jpeg",
    title: "Build habits that stick",
    subtitle: "Visual streaks. Daily momentum. No more zero days.",
    description: "Join 10,000+ users turning overwhelm into action",
    gradient: "from-black/70 via-black/0 to-black/85",
    titleColor: "text-white",
    accentColor: "text-[#90EE90]",
    badge: "10K+ USERS",
  },
  {
    id: 4,
    image: "/screenshots/calendar.jpeg",
    title: "Your entire month at a glance",
    description: "Track progress • Spot patterns • Celebrate wins",
    gradient: "from-black/75 via-transparent to-black/90",
    titleColor: "text-white",
    accentColor: "text-[#87CEEB]",
  },
  {
    id: 5,
    image: "/screenshots/day-view.jpeg",
    title: "Your perfect day, pre-planned",
    subtitle: "Time-blocked schedule ready when you wake up",
    cta: "Start Free Today",
    description: "3-day free trial • No credit card required",
    gradient: "from-black/80 via-black/0 to-black/95",
    titleColor: "text-white",
    accentColor: "text-[#FFD4A8]",
  },
];

export default function AppStorePreview() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = screenshots[currentIndex];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* App Store Screenshot Container - Exact dimensions */}
      <div className="relative">
        {/* The croppable area - 1242x2688px */}
        <div
          className="relative overflow-hidden bg-[#F5F1E8]"
          style={{
            width: "414px", // 1242px / 3 for screen display
            height: "896px", // 2688px / 3 for screen display
          }}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={current.image}
              alt={`Screenshot ${current.id}`}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-b ${current.gradient}`} />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-10 text-center">
            {/* Top Content */}
            <div className="space-y-4">
              {current.badge && (
                <div className="inline-block bg-[#FFD4A8] text-black px-6 py-2 rounded-full text-xs font-black tracking-wider">
                  {current.badge}
                </div>
              )}
              <h1 className={`text-5xl font-black leading-tight ${current.titleColor}`}>
                {current.title}
                {current.titleAccent && (
                  <>
                    <br />
                    <span className={current.accentColor}>{current.titleAccent}</span>
                  </>
                )}
              </h1>
              {current.subtitle && (
                <p className={`text-xl font-bold ${current.accentColor} leading-snug`}>
                  {current.subtitle}
                </p>
              )}
            </div>

            {/* Bottom Content */}
            <div className="space-y-4">
              {current.cta && (
                <div className="bg-[#FFD4A8] text-black px-10 py-4 rounded-full inline-block text-lg font-black">
                  {current.cta}
                </div>
              )}
              <p className="text-white text-lg font-semibold leading-relaxed">
                {current.description}
              </p>
              {current.subdescription && (
                <p className="text-white/90 text-base font-medium">
                  {current.subdescription}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Controls (outside croppable area) */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2">
          <button
            onClick={prevSlide}
            className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        </div>
        <div className="absolute -right-20 top-1/2 -translate-y-1/2">
          <button
            onClick={nextSlide}
            className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Slide Indicator */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
          {screenshots.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? "w-8 bg-[#FFD4A8]" : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-8 py-4 rounded-full text-sm font-medium">
        Screenshot {currentIndex + 1} of {screenshots.length} • Use Snipping Tool on the phone frame only
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xs">
        Use arrow keys ← → to navigate
      </div>
    </div>
  );
}
