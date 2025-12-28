export interface Organization {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  email: string;
  sameAs?: string[];
}

export interface WebApplication {
  "@context": "https://schema.org";
  "@type": "WebApplication";
  name: string;
  url: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
  };
}

export interface Article {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  author: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
}

export interface BreadcrumbList {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface FAQPage {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export function generateOrganizationSchema(): Organization {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "taskmelt",
    url: "https://taskmelt.app",
    logo: "https://taskmelt.app/icon.png",
    description: "Transform your mental chaos into organized tasks. Brain dump everything, let AI create your perfect schedule.",
    email: "junomobileapplications@gmail.com",
    sameAs: [],
  };
}

export function generateWebApplicationSchema(): WebApplication {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "taskmelt",
    url: "https://taskmelt.app",
    description: "AI-powered task management and habit tracking app. Transform mental chaos into clarity with brain dumps and intelligent scheduling.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "iOS, Android, Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function generateArticleSchema(
  headline: string,
  description: string,
  datePublished: string,
  image?: string
): Article {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    image,
    datePublished,
    dateModified: datePublished,
    author: {
      "@type": "Organization",
      name: "taskmelt",
      url: "https://taskmelt.app",
    },
    publisher: {
      "@type": "Organization",
      name: "taskmelt",
      url: "https://taskmelt.app",
      logo: {
        "@type": "ImageObject",
        url: "https://taskmelt.app/icon.png",
      },
    },
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): BreadcrumbList {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): FAQPage {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
