# taskmelt Landing Page

A professional, Apple-quality marketing landing page for taskmelt built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- **Apple-inspired Design**: Clean, minimalist aesthetic matching taskmelt's brand
- **Fully Responsive**: Mobile-first design that works beautifully on all devices
- **Smooth Animations**: Framer Motion animations and scroll effects
- **Optimized Performance**: Next.js Image optimization and lazy loading
- **SEO Ready**: Complete meta tags and structured data
- **TypeScript**: Full type safety throughout

## Design System

### Colors
- **Background**: Warm beige (#F5F1E8)
- **Text**: Near black (#1A1A1A)
- **Accents**: Pink, Peach, Blue, Green

### Typography
- System font stack (SF Pro on Apple devices)
- Bold headings (700-900 weight)
- Generous spacing and line height

### Components
- **Hero**: Full viewport hero with tagline and CTA
- **Features**: Alternating layout feature showcase
- **Screenshots**: Grid gallery of app screens
- **SocialProof**: Stats, ratings, and testimonials
- **Download**: Final CTA with app store buttons
- **Footer**: Links, social media, and copyright

## Getting Started

### Install Dependencies
\`\`\`bash
npm install
\`\`\`

### Run Development Server
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

### Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project to Vercel
3. Deploy automatically

### Netlify
1. Run `npm run build`
2. Deploy the `.next` folder
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`

## Customization

### Update App Store Links
Edit `components/Download.tsx` and replace placeholder links:
\`\`\`tsx
href="#download-ios" // Replace with actual App Store URL
href="#download-android" // Replace with actual Google Play URL
\`\`\`

### Update Social Links
Edit `components/Footer.tsx` to add your social media links.

### Update Content
All text content is directly in the components for easy customization.

## Project Structure

\`\`\`
landing/
├── app/
│   ├── layout.tsx          # Root layout with SEO
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles
├── components/
│   ├── Hero.tsx           # Hero section
│   ├── Features.tsx       # Feature showcase
│   ├── Screenshots.tsx    # App screenshots
│   ├── SocialProof.tsx    # Stats and testimonials
│   ├── Download.tsx       # Download CTAs
│   └── Footer.tsx         # Footer
├── public/
│   └── screenshots/       # App screenshots
├── tailwind.config.ts     # Tailwind theme
└── package.json
\`\`\`

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## License

MIT
