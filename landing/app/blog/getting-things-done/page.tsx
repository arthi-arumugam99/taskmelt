import { Metadata } from "next";
import Link from "next/link";
import StructuredData from "@/components/StructuredData";
import RelatedArticles from "@/components/RelatedArticles";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/structured-data";

const slug = "getting-things-done";
const title = "Getting Things Done (GTD): Complete Guide to David Allen's System (2025)";
const description = "Master the Getting Things Done (GTD) methodology for stress-free productivity. Complete guide to David Allen's proven system with examples, templates, and implementation strategies.";
const publishDate = "2025-12-17T10:00:00Z";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "getting things done",
    "GTD method",
    "david allen gtd",
    "gtd system",
    "productivity system gtd",
    "gtd workflow",
    "getting things done book",
    "gtd methodology",
    "task management system",
    "gtd tutorial",
    "how to gtd",
    "gtd for beginners"
  ],
  openGraph: {
    title,
    description,
    url: `https://taskmelt.app/blog/${slug}`,
    type: "article",
    publishedTime: publishDate,
    authors: ["taskmelt Team"],
    siteName: "taskmelt",
    images: [
      {
        url: "https://taskmelt.app/icon.png",
        width: 512,
        height: 512,
        alt: "Getting Things Done GTD Guide",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@taskmelt",
    images: ["https://taskmelt.app/icon.png"],
  },
  alternates: {
    canonical: `https://taskmelt.app/blog/${slug}`,
  },
};

const relatedArticles = [
  {
    href: "/blog/brain-dump-technique-productivity",
    title: "The Brain Dump Technique: Clear Mental Clutter",
    description: "Learn how to use brain dumping to reduce overwhelm and boost productivity.",
  },
  {
    href: "/blog/time-blocking-guide",
    title: "Time Blocking Guide: Master Your Schedule",
    description: "Complete guide to time blocking for maximum productivity and focus.",
  },
  {
    href: "/blog/productivity-apps-comparison",
    title: "Best Productivity Apps Comparison",
    description: "Compare the top productivity apps to find your perfect tool.",
  },
  {
    href: "/blog/build-lasting-habits",
    title: "Build Lasting Habits That Stick",
    description: "Science-based strategies to build habits that last a lifetime.",
  }
];

export default function GTD() {
  const articleSchema = generateArticleSchema(
    title,
    description,
    publishDate
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://taskmelt.app" },
    { name: "Blog", url: "https://taskmelt.app/blog" },
    { name: "Getting Things Done (GTD)", url: `https://taskmelt.app/blog/${slug}` },
  ]);

  return (
    <>
      <StructuredData data={articleSchema} />
      <StructuredData data={breadcrumbSchema} />

      <article className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/blog" className="text-taskmelt-gray hover:text-taskmelt-black mb-8 inline-block">
          ← Back to Blog
        </Link>

        <header className="mb-12">
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-taskmelt-green text-sm font-bold rounded-full">
              Systems
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Getting Things Done: The Complete GTD System Guide
          </h1>
          <p className="text-xl text-taskmelt-gray">
            December 17, 2025 · 12 min read
          </p>
        </header>

        <div className="prose prose-lg max-w-none space-y-8 text-lg leading-relaxed">
          <p className="text-2xl font-medium text-taskmelt-gray">
            Getting Things Done (GTD) is the gold standard productivity system trusted by millions.
            Here's your complete guide to implementing David Allen's stress-free productivity methodology.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">What is Getting Things Done (GTD)?</h2>
          <p>
            Getting Things Done, commonly known as GTD, is a comprehensive productivity methodology created by
            David Allen and detailed in his bestselling book. The system is built on a simple principle: your
            mind is for having ideas, not holding them.
          </p>

          <p>
            When you try to remember everything you need to do, your brain wastes precious mental energy on
            storage instead of processing. GTD solves this by providing a trusted external system to capture,
            organize, and track all your commitments. The result? A calm, clear mind that can focus on doing
            great work instead of remembering what to do.
          </p>

          <p>
            Unlike simple to-do lists, GTD is a complete workflow that handles everything from random ideas
            to multi-year projects. It's used by everyone from CEOs to students, developers to designers.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">The 5 Core Steps of GTD</h2>

          <p>
            GTD revolves around five key steps that form a continuous workflow. Master these, and you'll
            transform how you work.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">1. Capture: Collect Everything</h3>
          <p>
            The first step is to capture absolutely everything that has your attention. This means every task,
            idea, reminder, worry, or commitment goes into a trusted collection system—not your brain.
          </p>

          <p><strong>What to capture:</strong></p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Tasks and action items ("Email John about the proposal")</li>
            <li>Projects ("Renovate kitchen")</li>
            <li>Ideas ("Blog post idea: productivity for remote teams")</li>
            <li>Commitments ("Remember to call mom on Sunday")</li>
            <li>Questions ("What's the deadline for the tax filing?")</li>
            <li>Things bothering you ("Garage needs organizing")</li>
          </ul>

          <p>
            The key is to have an inbox—physical or digital—where everything gets collected. David Allen
            recommends doing a complete "mind sweep" where you spend 1-2 hours writing down absolutely
            everything on your mind.
          </p>

          <p>
            This is where taskmelt's brain dump feature excels. Simply speak or type everything that's
            on your mind, and our AI will capture it all without you needing to organize anything yet.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">2. Clarify: Process What It Means</h3>
          <p>
            Once you've captured everything, it's time to clarify what each item actually means and what,
            if anything, you need to do about it.
          </p>

          <p><strong>For each item, ask:</strong></p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Is it actionable?</strong> Does this require action from me?</li>
            <li>If NO: Trash it, save it as reference, or add to "Someday/Maybe" list</li>
            <li>If YES: What's the very next physical action?</li>
          </ul>

          <p>
            Here's the critical GTD insight: you can't "do" a project like "Plan vacation." You can only
            do specific actions like "Search flights to Hawaii" or "Ask Sarah for hotel recommendations."
            Always identify the next physical action.
          </p>

          <p><strong>The two-minute rule:</strong></p>
          <p>
            If an action takes less than two minutes, do it immediately during processing. It takes longer
            to file and track it than to just do it. Reply to that quick email now. Make that phone call.
            File that document.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">3. Organize: Put It Where It Belongs</h3>
          <p>
            Now that you know what each item means, organize it into the appropriate category:
          </p>

          <p><strong>GTD Categories:</strong></p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Next Actions:</strong> Single-step tasks you can do immediately (e.g., "Call dentist to schedule cleaning")</li>
            <li><strong>Projects:</strong> Outcomes requiring more than one action (e.g., "Launch new website")</li>
            <li><strong>Waiting For:</strong> Items you're waiting on from others (e.g., "Waiting for John's budget approval")</li>
            <li><strong>Someday/Maybe:</strong> Things you might want to do but not now (e.g., "Learn Spanish")</li>
            <li><strong>Calendar:</strong> Time-specific commitments (meetings, deadlines, appointments)</li>
            <li><strong>Reference:</strong> Information you might need later but doesn't require action</li>
          </ul>

          <p>
            The calendar is sacred in GTD. It should only contain things that must happen at a specific time.
            Don't pollute it with tasks that could happen anytime. Those go on your Next Actions list.
          </p>

          <p>
            You can also organize by context—the tools, location, or person needed to complete an action.
            Common contexts include @Computer, @Phone, @Home, @Office, @Errands, or @Agenda-[Person].
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">4. Reflect: Review and Update</h3>
          <p>
            Your system is only as good as your trust in it. If you don't maintain it, you'll go back to
            keeping things in your head.
          </p>

          <p><strong>The Daily Review (5-10 minutes):</strong></p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Check your calendar for today's commitments</li>
            <li>Review your Next Actions list</li>
            <li>Process any new items in your inbox</li>
            <li>Update the status of projects</li>
          </ul>

          <p><strong>The Weekly Review (1-2 hours):</strong></p>
          <p>
            The Weekly Review is the backbone of GTD. Set aside time every week (many people do Friday
            afternoon or Sunday evening) to:
          </p>

          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Get Clear: Process all inboxes to zero</li>
            <li>Get Current: Review Next Actions, calendar, and Waiting For lists</li>
            <li>Get Creative: Review Someday/Maybe and brainstorm new projects</li>
            <li>Review all projects to ensure each has a Next Action</li>
            <li>Look ahead at upcoming calendar commitments</li>
          </ol>

          <p>
            This weekly ritual keeps your system trustworthy and your mind clear. Skip it, and the whole
            system starts to break down.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">5. Engage: Do the Work</h3>
          <p>
            With everything captured, clarified, organized, and reviewed, you can now simply do the work
            with confidence.
          </p>

          <p><strong>When deciding what to do, GTD recommends considering:</strong></p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Context:</strong> What can you do based on your current tools, location, and energy?</li>
            <li><strong>Time available:</strong> Do you have 5 minutes or 2 hours?</li>
            <li><strong>Energy available:</strong> Are you sharp and focused, or mentally drained?</li>
            <li><strong>Priority:</strong> Of the available options, what's most important?</li>
          </ol>

          <p>
            Because you've already processed and organized everything, you can trust that whatever you choose
            from your Next Actions list is the right thing to do. No more second-guessing or anxiety about
            what you might be forgetting.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">Why GTD Works: The Science Behind It</h2>

          <p>
            GTD isn't just a productivity hack—it's based on how our brains actually work.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">The Zeigarnik Effect</h3>
          <p>
            Psychologist Bluma Zeigarnik discovered that our brains keep incomplete tasks in active memory,
            consuming mental energy even when we're not working on them. This is why open loops create stress
            and mental clutter.
          </p>

          <p>
            GTD "completes" these loops by capturing them in a trusted system. Your brain stops worrying
            because it knows the commitment is tracked and will be reviewed.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">Cognitive Load Reduction</h3>
          <p>
            Research shows that working memory can only hold 4-7 items at once. When you try to remember
            dozens of tasks, meetings, and ideas, your cognitive capacity for actual thinking plummets.
          </p>

          <p>
            By externalizing everything into GTD lists, you free up working memory for problem-solving,
            creativity, and focus.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">Getting Started with GTD: Your First Week</h2>

          <p><strong>Day 1-2: Complete Mind Sweep and Initial Capture</strong></p>
          <p>
            Spend 1-2 hours doing a complete brain dump of everything on your mind. Walk through every
            area of your life: work projects, personal commitments, home repairs, financial tasks,
            relationship commitments, health goals, etc.
          </p>

          <p><strong>Day 3-4: Clarify and Organize</strong></p>
          <p>
            Process everything you captured. Identify next actions, create project lists, set up your
            categories. This takes time initially but gets much faster once the system is running.
          </p>

          <p><strong>Day 5: Set Up Your Weekly Review</strong></p>
          <p>
            Schedule a recurring 90-minute block for your Weekly Review. Protect this time fiercely.
            It's the most important GTD habit.
          </p>

          <p><strong>Day 6-7: Start Engaging</strong></p>
          <p>
            Begin working from your Next Actions lists. Notice how much clearer and calmer you feel
            knowing everything is captured and organized.
          </p>

          <div className="taskmelt-border bg-taskmelt-blue p-8 my-12">
            <h3 className="text-2xl font-black mb-4">GTD Made Easy with taskmelt</h3>
            <p className="mb-6">
              taskmelt implements GTD principles with AI assistance. Capture everything with brain dumps,
              let AI automatically organize by context and priority, and get a perfectly scheduled day.
              All the power of GTD without the manual overhead.
            </p>
            <Link
              href="/#download"
              className="inline-block taskmelt-border bg-taskmelt-black text-white px-8 py-4 text-lg font-bold hover:bg-opacity-90 transition-all"
            >
              Download taskmelt Free
            </Link>
          </div>

          <h2 className="text-4xl font-black mt-12 mb-6">Common GTD Mistakes to Avoid</h2>

          <h3 className="text-3xl font-bold mt-8 mb-4">Mistake #1: Not Processing to Empty</h3>
          <p>
            Your inbox should get to zero regularly. If you let items pile up unprocessed, you lose trust
            in your system and start keeping things in your head again.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">Mistake #2: Skipping the Weekly Review</h3>
          <p>
            The Weekly Review is non-negotiable. Without it, your lists become outdated, projects stall,
            and the system falls apart. Protect this time like you would a critical meeting.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">Mistake #3: Projects Without Next Actions</h3>
          <p>
            Every project must have at least one next action defined. Otherwise, it's just a wish list.
            "Plan vacation" isn't actionable. "Search Hawaii flights for June" is.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">Mistake #4: Overly Complex Systems</h3>
          <p>
            Some people get obsessed with the perfect GTD tool and spend more time organizing than doing.
            Keep it simple. Even paper lists work if you consistently maintain them.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">Mistake #5: Putting Tasks on the Calendar</h3>
          <p>
            The calendar is for time-specific commitments only. Tasks go on Next Actions lists. If you
            clutter your calendar with tasks, you'll lose trust in both systems.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">GTD Tools and Technology</h2>

          <p>
            GTD can work with any system—paper, digital, or hybrid. Popular digital GTD tools include:
          </p>

          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>taskmelt:</strong> AI-powered GTD with automatic capture and organization</li>
            <li><strong>Todoist:</strong> Flexible task manager with GTD templates</li>
            <li><strong>Things:</strong> Beautiful Mac/iOS GTD app</li>
            <li><strong>Notion:</strong> Customizable database for GTD workflows</li>
            <li><strong>Paper + Pen:</strong> David Allen's original method—still works perfectly</li>
          </ul>

          <p>
            The tool matters less than the consistent practice of the five steps: Capture, Clarify,
            Organize, Reflect, Engage.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">GTD for Specific Situations</h2>

          <h3 className="text-3xl font-bold mt-8 mb-4">GTD for Students</h3>
          <p>
            Students benefit enormously from GTD's project management approach. Each class becomes a project
            with next actions for readings, assignments, and exam prep. The stress-free approach helps manage
            multiple courses simultaneously.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">GTD for Entrepreneurs</h3>
          <p>
            Entrepreneurs juggle multiple roles and projects constantly. GTD provides the structure to
            manage business development, client work, marketing, finances, and personal commitments without
            mental overwhelm.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">GTD for Teams</h3>
          <p>
            While GTD is personal, teams can adopt shared practices: regular project reviews, clear next
            action assignments, and "Waiting For" lists that track inter-team dependencies.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">Frequently Asked Questions</h2>

          <h3 className="text-3xl font-bold mt-8 mb-4">How long does it take to set up GTD?</h3>
          <p>
            Initial setup takes 4-10 hours: 1-2 hours for mind sweep, 2-4 hours to process and organize
            everything, and 1-2 hours to set up your system. After that, daily maintenance is 10-15 minutes
            plus a weekly 1-2 hour review.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">Can I use GTD with other productivity methods?</h3>
          <p>
            Absolutely. GTD works great with time blocking, Pomodoro technique, deep work principles, and
            more. GTD handles the "what" to do, while these methods help with the "how" to do it.
          </p>

          <h3 className="text-3xl font-bold mt-8 mb-4">What if I fall off the GTD wagon?</h3>
          <p>
            It happens to everyone. Do a fresh mind sweep, process everything to zero, and recommit to the
            Weekly Review. The system is forgiving—you can always get back on track.
          </p>

          <h2 className="text-4xl font-black mt-12 mb-6">Final Thoughts: Your Mind Like Water</h2>

          <p>
            David Allen uses the metaphor "mind like water"—when you throw a pebble in a pond, the water
            responds appropriately, then returns to calm. That's how your mind works with GTD.
          </p>

          <p>
            Without GTD, your mind is choppy with anxiety about what you're forgetting. With GTD, you
            respond appropriately to whatever comes up, then return to calm, clear focus.
          </p>

          <p>
            The magic isn't in the lists or the tools. It's in the trust you build with yourself—the
            confidence that nothing is falling through the cracks because everything is captured,
            clarified, organized, and regularly reviewed.
          </p>

          <p className="text-2xl font-bold mt-8">
            Start your GTD practice today. Your future self will thank you for the gift of a clear,
            stress-free mind.
          </p>
        </div>

        <RelatedArticles articles={relatedArticles} />
      </div>
    </article>
    </>
  );
}
