"use client";

import Image from "next/image";

export default function Showcase() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      {/* Hero 1: Massive Title with Screenshot */}
      <section className="min-h-screen flex items-center justify-center px-20 py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-[#FFD4A8]/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-20 items-center relative z-10">
          <div>
            <h1 className="text-[120px] font-black leading-[0.9] text-white mb-8">
              Chaos<br/>
              in.<br/>
              <span className="italic text-[#FFD4A8]">Clarity</span><br/>
              out.
            </h1>
            <p className="text-2xl text-gray-400 leading-relaxed">
              Transform overwhelming thoughts into organized action with AI-powered brain dumping.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#FFD4A8] to-[#FFB3D9] rounded-3xl blur-xl opacity-20" />
            <Image
              src="/screenshots/brain-dump.jpeg"
              alt="Brain Dump"
              width={500}
              height={1000}
              className="relative rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Split Screen */}
      <section className="min-h-screen grid grid-cols-2">
        <div className="bg-[#F5F1E8] flex items-center justify-center p-20">
          <div className="max-w-xl">
            <div className="inline-block bg-black text-white px-6 py-3 rounded-full text-sm font-bold mb-8">
              STEP 01
            </div>
            <h2 className="text-7xl font-black text-black mb-6 leading-tight">
              Brain<br/>Dump<br/>Everything
            </h2>
            <p className="text-2xl text-gray-700 leading-relaxed">
              Type or speak. Tasks, ideas, worries, random thoughts. No organizing needed. Just get it all out.
            </p>
          </div>
        </div>
        <div className="bg-black flex items-center justify-center p-20">
          <Image
            src="/screenshots/brain-dump.jpeg"
            alt="Brain Dump Interface"
            width={400}
            height={800}
            className="rounded-2xl shadow-2xl"
          />
        </div>
      </section>

      {/* Section 3: Centered Large Screenshot */}
      <section className="min-h-screen bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center px-20 py-32">
        <div className="text-center max-w-6xl">
          <h2 className="text-8xl font-black text-white mb-6">
            AI Does the Heavy Lifting
          </h2>
          <p className="text-2xl text-[#FFD4A8] mb-16 font-medium">
            Smart time estimates • Auto-scheduling • Intelligent prioritization
          </p>
          <div className="relative inline-block">
            <div className="absolute -inset-8 bg-gradient-to-r from-[#87CEEB] via-[#FFD4A8] to-[#FFB3D9] rounded-3xl blur-2xl opacity-20" />
            <Image
              src="/screenshots/tasks.jpeg"
              alt="Organized Tasks"
              width={500}
              height={1000}
              className="relative rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Section 4: Side by Side Comparison */}
      <section className="min-h-screen bg-[#F5F1E8] px-20 py-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-8xl font-black text-black mb-20 text-center">
            Before & After
          </h2>
          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="bg-white/50 backdrop-blur p-8 rounded-3xl mb-6">
                <h3 className="text-3xl font-black text-gray-800 mb-4">Before taskmelt</h3>
                <ul className="space-y-3 text-xl text-gray-600">
                  <li>• Scattered thoughts everywhere</li>
                  <li>• Overwhelming mental clutter</li>
                  <li>• Forgotten tasks & ideas</li>
                  <li>• No clear plan</li>
                </ul>
              </div>
              <Image
                src="/screenshots/brain-dump.jpeg"
                alt="Before"
                width={400}
                height={800}
                className="rounded-2xl shadow-lg"
              />
            </div>
            <div>
              <div className="bg-[#FFD4A8] p-8 rounded-3xl mb-6">
                <h3 className="text-3xl font-black text-black mb-4">After taskmelt</h3>
                <ul className="space-y-3 text-xl text-black/80">
                  <li>✓ Crystal clear schedule</li>
                  <li>✓ Nothing falls through cracks</li>
                  <li>✓ Organized & prioritized</li>
                  <li>✓ Peace of mind</li>
                </ul>
              </div>
              <Image
                src="/screenshots/tasks.jpeg"
                alt="After"
                width={400}
                height={800}
                className="rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Clean App Store Style */}
      <section className="min-h-screen bg-black flex items-center justify-center px-12 py-20">
        <div className="flex gap-4 items-start">
          {/* Screenshot 1 */}
          <div className="relative w-[240px]">
            <div className="absolute -top-3 left-3 z-10">
              <div className="bg-[#C4A7E7] rounded-lg px-3 py-1.5 inline-block">
                <p className="text-[11px] font-semibold text-black">Dump everything<br/>on your mind</p>
              </div>
            </div>
            <div className="rounded-[28px] overflow-hidden border-4 border-gray-900">
              <Image
                src="/screenshots/brain-dump.jpeg"
                alt="Brain Dump"
                width={240}
                height={520}
                className="w-full"
              />
            </div>
          </div>

          {/* Screenshot 2 */}
          <div className="relative w-[240px]">
            <div className="absolute -top-3 left-3 z-10">
              <div className="bg-[#C8E6C9] rounded-lg px-3 py-1.5 inline-block">
                <p className="text-[11px] font-semibold text-black">Track your<br/>progress</p>
              </div>
            </div>
            <div className="rounded-[28px] overflow-hidden border-4 border-gray-900">
              <Image
                src="/screenshots/tasks.jpeg"
                alt="Tasks"
                width={240}
                height={520}
                className="w-full"
              />
            </div>
          </div>

          {/* Screenshot 3 */}
          <div className="relative w-[240px]">
            <div className="absolute -top-3 left-3 z-10">
              <div className="bg-[#FFECB3] rounded-lg px-3 py-1.5 inline-block">
                <p className="text-[11px] font-semibold text-black">Just snap a<br/>picture</p>
              </div>
            </div>
            <div className="rounded-[28px] overflow-hidden border-4 border-gray-900">
              <Image
                src="/screenshots/calendar.jpeg"
                alt="Calendar"
                width={240}
                height={520}
                className="w-full"
              />
            </div>
          </div>

          {/* Screenshot 4 */}
          <div className="relative w-[240px]">
            <div className="absolute -top-3 left-3 z-10">
              <div className="bg-[#FFE0B2] rounded-lg px-3 py-1.5 inline-block">
                <p className="text-[11px] font-semibold text-black">Then let AI do<br/>the work</p>
              </div>
            </div>
            <div className="rounded-[28px] overflow-hidden border-4 border-gray-900">
              <Image
                src="/screenshots/habits.jpeg"
                alt="Habits"
                width={240}
                height={520}
                className="w-full"
              />
            </div>
          </div>

          {/* Screenshot 5 */}
          <div className="relative w-[240px]">
            <div className="absolute -top-3 left-3 z-10">
              <div className="bg-white rounded-lg px-3 py-1.5 inline-block">
                <p className="text-[11px] font-semibold text-black">Personalized<br/>schedules</p>
              </div>
            </div>
            <div className="rounded-[28px] overflow-hidden border-4 border-gray-900">
              <Image
                src="/screenshots/day-view.jpeg"
                alt="Day View"
                width={240}
                height={520}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Floating Screenshot with Stats */}
      <section className="min-h-screen bg-gradient-to-br from-[#FFD4A8] to-[#FFB3D9] flex items-center justify-center px-20 py-32 relative overflow-hidden">
        <div className="absolute top-20 right-20 text-black/10 text-[300px] font-black">10K+</div>
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-20 items-center relative z-10">
          <div>
            <div className="inline-block bg-black text-white px-6 py-3 rounded-full text-sm font-bold mb-8">
              SOCIAL PROOF
            </div>
            <h2 className="text-7xl font-black text-black mb-8 leading-tight">
              Join 10,000+<br/>
              Organized<br/>
              Minds
            </h2>
            <div className="space-y-6">
              <div className="bg-white/40 backdrop-blur p-6 rounded-2xl">
                <div className="text-5xl font-black text-black mb-2">4.9★</div>
                <p className="text-xl text-black/70">App Store Rating</p>
              </div>
              <div className="bg-white/40 backdrop-blur p-6 rounded-2xl">
                <div className="text-5xl font-black text-black mb-2">1M+</div>
                <p className="text-xl text-black/70">Tasks Organized</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/screenshots/habits.jpeg"
              alt="Habits"
              width={500}
              height={1000}
              className="rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Section 7: Minimalist Feature Highlight */}
      <section className="min-h-screen bg-white flex items-center justify-center px-20 py-32">
        <div className="max-w-4xl text-center">
          <div className="mb-16">
            <Image
              src="/screenshots/day-view.jpeg"
              alt="Day View"
              width={400}
              height={800}
              className="rounded-3xl shadow-2xl mx-auto"
            />
          </div>
          <h2 className="text-6xl font-black text-black mb-6">
            Your Perfect Day,<br/>Pre-Planned
          </h2>
          <p className="text-2xl text-gray-600 leading-relaxed">
            Wake up to a time-blocked schedule designed around your energy levels, priorities, and commitments.
          </p>
        </div>
      </section>

      {/* Section 8: Dark CTA */}
      <section className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-20 py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD4A8]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#87CEEB]/10 rounded-full blur-3xl" />
        </div>
        <div className="text-center relative z-10 max-w-5xl">
          <h2 className="text-[100px] font-black text-white leading-tight mb-8">
            Start Melting<br/>Your Chaos
          </h2>
          <p className="text-3xl text-gray-400 mb-12">
            Free to download. $6.99/month for unlimited everything.
          </p>
          <div className="inline-block bg-[#FFD4A8] text-black px-16 py-8 rounded-full text-2xl font-black hover:scale-105 transition-transform cursor-pointer">
            Download for iPhone
          </div>
        </div>
      </section>

      {/* Section 9: Grid Showcase */}
      <section className="bg-[#F5F1E8] px-20 py-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-7xl font-black text-black mb-20">
            Every Detail,<br/>Perfected
          </h2>
          <div className="grid grid-cols-4 gap-8">
            <div className="col-span-2 row-span-2">
              <Image
                src="/screenshots/brain-dump.jpeg"
                alt="Feature"
                width={600}
                height={1200}
                className="rounded-2xl shadow-lg w-full h-full object-cover"
              />
            </div>
            <div className="col-span-2">
              <Image
                src="/screenshots/tasks.jpeg"
                alt="Feature"
                width={600}
                height={600}
                className="rounded-2xl shadow-lg w-full h-full object-cover"
              />
            </div>
            <div>
              <Image
                src="/screenshots/habits.jpeg"
                alt="Feature"
                width={300}
                height={600}
                className="rounded-2xl shadow-lg w-full h-full object-cover"
              />
            </div>
            <div>
              <Image
                src="/screenshots/calendar.jpeg"
                alt="Feature"
                width={300}
                height={600}
                className="rounded-2xl shadow-lg w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
