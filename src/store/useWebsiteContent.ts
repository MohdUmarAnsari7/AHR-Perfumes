import { create } from "zustand";

export interface WebsiteSectionData {
  home: {
    hero: {
      slides: Array<{
        title: string;
        subtitle: string;
        buttonText: string;
        buttonLink: string;
        image: string;
        mobileImage?: string;
      }>;
    };
    highlights: {
      title: string;
      subtitle: string;
      items: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    best_sellers: {
      title: string;
      subtitle: string;
      slides?: Array<{
        id: string;
        image: string;
        name: string;
        price: string | number;
        category: string;
        rating?: number;
      }>;
    };
    categories_section: {
      title: string;
      subtitle: string;
    };
    featured_collections: {
      title: string;
      subtitle: string;
      tabs: Array<{
        tabName: string;
        title: string;
        description: string;
        image: string;
        mobileImage?: string;
        buttonText: string;
        buttonLink: string;
      }>;
    };
    why_choose_us: {
      title: string;
      subtitle: string;
      reasons: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    testimonials: {
      title: string;
      subtitle: string;
      items: Array<{
        author: string;
        text: string;
        rating: number;
      }>;
    };
    gallery: {
      title: string;
      subtitle: string;
    };
    stats: {
      title: string;
      items: Array<{
        value: string;
        label: string;
      }>;
    };
    contact_cta: {
      title: string;
      subtitle: string;
      bgImage: string;
      buttonText: string;
      buttonLink: string;
    };
  };
  shop: {
    hero: {
      title: string;
      subtitle: string;
      bgImage: string;
    };
    grid: {
      title: string;
      subtitle: string;
    };
  };
  categories: {
    hero: {
      title: string;
      subtitle: string;
      bgImage: string;
    };
    grid: {
      title: string;
      subtitle: string;
    };
  };
  about: {
    hero: {
      title: string;
      subtitle: string;
      bgImage: string;
    };
    story: {
      title: string;
      storyTitle: string;
      storyText: string;
      storyImage: string;
      quoteText: string;
      quoteAuthor: string;
    };
    values: {
      title: string;
      subtitle: string;
      items: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
  };
  gallery_page: {
    hero: {
      title: string;
      subtitle: string;
      bgImage: string;
    };
    grid: {
      title: string;
      subtitle: string;
    };
  };
  contact: {
    hero: {
      title: string;
      subtitle: string;
      bgImage: string;
    };
    details: {
      title: string;
      subtitle: string;
      address: string;
      phone: string;
      email: string;
      instagram: string;
      hoursWeekdays: string;
      hoursSunday: string;
      mapImage: string;
      mapLocation?: string;
    };
    form_section: {
      title: string;
      subtitle: string;
      image?: string;
    };
    why_visit_us?: {
      title: string;
      subtitle: string;
      items: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
  };
}

interface WebsiteContentState {
  homepage: {
    heroHeading: string;
    heroSubheading: string;
    heroButtonText: string;
    heroImages: string[];
    aboutSection: string;
    missionVision: string;
    services: Array<{ title: string; description: string; icon: string }>;
    testimonials: Array<{ id: number; rating: number; text: string; author: string }>;
    clientLogos: string[];
    contactInfo: {
      address: string;
      phone: string;
      email: string;
      instagram: string;
    };
    footerContent: {
      description: string;
      copyright: string;
    };
  };
  pageImages: {
    home: {
      hero_banner: string;
      services_section: string;
      about_preview: string;
      testimonials: string;
      clients: string;
      footer: string;
    };
    about: {
      banner: string;
      company_images: string[];
      team_images: string[];
    };
    services: {
      service_banners: string[];
      service_icons: string[];
      gallery: string[];
    };
    products: {
      product_banners: string[];
      product_images: string[];
    };
    contact: {
      banner: string;
      office_images: string[];
      map_image: string;
    };
  };
  websiteSections: WebsiteSectionData;
  loading: boolean;
  error: string | null;
  fetchContent: () => Promise<void>;
  updateHomepage: (payload: any) => Promise<void>;
  updatePageImages: (payload: any) => Promise<void>;
  updateWebsiteSections: (payload: WebsiteSectionData) => Promise<void>;
}

const DEFAULT_HOMEPAGE = {
  heroHeading: "Premium Attars Crafted With Tradition",
  heroSubheading: "A.H.R Perfumes",
  heroButtonText: "Explore Collection",
  heroImages: [
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2500&auto=format&fit=crop"
  ],
  aboutSection: "A.H.R Perfumes is Indore's premier luxury fragrance destination. Founded on the heritage of rich, pure fragrance crafting, we provide a sophisticated collection of traditional attars, luxury modern perfumes, authentic bakhoor, and customized gifting options.",
  missionVision: "To preserve and promote the traditional art of natural attar blending while curating modern, long-lasting luxury scents for fragrance enthusiasts worldwide. We envision A.H.R Perfumes as a global brand trusted for pure ingredients, unmatched performance, and heritage craftsmanship.",
  services: [
    { "title": "Premium Attars", "description": "Authentic traditional concentrated oils.", "icon": "Droplet" },
    { "title": "Luxury Perfumes", "description": "Modern premium long-lasting sprays.", "icon": "Sparkles" },
    { "title": "Wholesale Supply", "description": "Bulk fragrance solutions for retail.", "icon": "Package" },
    { "title": "Expert Guidance", "description": "Personalized scent recommendations.", "icon": "UserCheck" }
  ],
  testimonials: [
    { "id": 1, "rating": 5, "text": "Excellent perfumes and genuine attars. Best prices in Indore. Highly recommend their Oud collection.", "author": "Mohammed F." },
    { "id": 2, "rating": 5, "text": "The lasting power of their attars is incredible. True luxury experience every time I visit the store.", "author": "Sara K." },
    { "id": 3, "rating": 5, "text": "Ordered a custom gift set for a wedding. The packaging and fragrance quality exceeded expectations.", "author": "Rahul S." }
  ],
  clientLogos: [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80",
    "https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=200&q=80",
    "https://images.unsplash.com/photo-1618004835415-6bcb08aa1a7c?w=200&q=80"
  ],
  contactInfo: {
    address: "147 Jawahar Marg, Near Minara Masjid, Bombay Bazar, Indore, Madhya Pradesh 452002",
    phone: "+91 99261 80003",
    email: "contact@ahrperfumes.com",
    instagram: "@a.h.r.perfumes_"
  },
  footerContent: {
    description: "Where Every Scent Tells a Story. Discover our rich collection of artisanal attars and masterfully crafted perfumes since 2007.",
    copyright: "© 2026 A.H.R Perfumes. All Rights Reserved."
  }
};

const DEFAULT_PAGE_IMAGES = {
  home: {
    hero_banner: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop",
    services_section: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=1000&auto=format&fit=crop",
    about_preview: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop",
    testimonials: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=1000&auto=format&fit=crop",
    clients: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    footer: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=1000&auto=format&fit=crop"
  },
  about: {
    banner: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200",
    company_images: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000",
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=1000"
    ],
    team_images: [
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500"
    ]
  },
  services: {
    service_banners: [
      "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=1000"
    ],
    service_icons: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=300"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
      "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=800",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800"
    ]
  },
  products: {
    product_banners: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200"
    ],
    product_images: [
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800"
    ]
  },
  contact: {
    banner: "https://images.unsplash.com/photo-1620021665476-805fd843e987?q=80&w=1200",
    office_images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600"
    ],
    map_image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600"
  }
};

export const DEFAULT_WEBSITE_SECTIONS: WebsiteSectionData = {
  home: {
    hero: {
      slides: [
        {
          title: "Premium Attars Crafted With Tradition",
          subtitle: "A.H.R Perfumes",
          buttonText: "Explore Collection",
          buttonLink: "/shop",
          image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop"
        },
        {
          title: "Handcrafted Luxury Fragrances",
          subtitle: "Pure Essence Of Indore",
          buttonText: "Shop Perfumes",
          buttonLink: "/shop",
          image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2500&auto=format&fit=crop"
        },
        {
          title: "Artisanal Gifting & Pure Oud",
          subtitle: "Exclusive Wedding Collections",
          buttonText: "Contact Us",
          buttonLink: "/contact",
          image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2500&auto=format&fit=crop"
        }
      ]
    },
    highlights: {
      title: "",
      subtitle: "",
      items: [
        { icon: "Calendar", title: "13+ Years Experience", description: "Trusted fragrance retailer since 2007." },
        { icon: "ShieldCheck", title: "Premium Quality", description: "Original, authentic Attars & Perfumes." },
        { icon: "Package", title: "Wholesale Supply", description: "Bulk orders and corporate gifting available." },
        { icon: "Truck", title: "Pan India Delivery", description: "Fast, secure, and reliable shipping." }
      ]
    },
    best_sellers: {
      title: "Our Best Sellers",
      subtitle: "Handpicked fragrance masterpieces loved by our patrons",
      slides: [
        {
          id: "slide_p1",
          name: "Oud Al Amiri",
          category: "Attars",
          price: 1200,
          rating: 4.9,
          image: "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=1000&auto=format&fit=crop"
        },
        {
          id: "slide_p2",
          name: "Mukhallat Maliki",
          category: "Attars",
          price: 850,
          rating: 4.8,
          image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000&auto=format&fit=crop"
        },
        {
          id: "slide_p4",
          name: "Shamama Tul Amber",
          category: "Attars",
          price: 2200,
          rating: 4.9,
          image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop"
        },
        {
          id: "slide_p5",
          name: "Midnight Velvet Noir",
          category: "Perfumes",
          price: 3500,
          rating: 4.7,
          image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop"
        }
      ]
    },
    categories_section: {
      title: "Fragrance Families",
      subtitle: "Discover your scent profile among our curated categories"
    },
    featured_collections: {
      title: "Featured Collections",
      subtitle: "Explore our masterfully blended fragrance chapters",
      tabs: [
        {
          tabName: "Oud & Woods",
          title: "The Royal Dehn Al Oud",
          description: "A rich, deep, and majestic collection of authentic ouds sourced from across Southeast Asia, perfect for grand occasions.",
          image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2500&auto=format&fit=crop",
          buttonText: "Explore Oud",
          buttonLink: "/shop?category=Attars"
        },
        {
          tabName: "Musk & Rose",
          title: "Pure Musk & Taifi Rose",
          description: "Delicate, clean musk paired with fresh taifi rose petals to deliver an elegant, clean, and refreshing trail that lasts all day.",
          image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2500&auto=format&fit=crop",
          buttonText: "Shop Soft Scents",
          buttonLink: "/shop?category=Attars"
        },
        {
          tabName: "Luxury Sprays",
          title: "Modern Premium Perfumes",
          description: "Our signature French-style Eau de Parfums blended with rich oriental heart notes for unmatched projection and sillage.",
          image: "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=2500&auto=format&fit=crop",
          buttonText: "Explore Sprays",
          buttonLink: "/shop?category=Perfumes"
        },
        {
          tabName: "Exquisite Gifts",
          title: "Custom Gifting Sets",
          description: "Beautifully packaged bespoke fragrance boxes including attar bottles, wood chips, and customized notes for your loved ones.",
          image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=2500&auto=format&fit=crop",
          buttonText: "Order Gift Set",
          buttonLink: "/contact"
        }
      ]
    },
    why_choose_us: {
      title: "Our Pure Promise",
      subtitle: "What makes A.H.R Perfumes Indore's premium fragrance brand",
      reasons: [
        { title: "Pure Ingredients", description: "Absolutely zero harmful chemicals or adulteration in our pure oil concentrates.", icon: "Droplet" },
        { title: "Exceptional Performance", description: "Carefully formulated to offer legendary sillage, longevity, and memory.", icon: "Sparkles" },
        { title: "Indore's Heritage", description: "Serving fragrance lovers since 2007 from our iconic Bombay Bazar boutique.", icon: "Award" },
        { title: "Custom Blending", description: "Speak with our founder, Mr. Hashim, to create a personalized fragrance recipe.", icon: "UserCheck" }
      ]
    },
    testimonials: {
      title: "Voices of Satisfaction",
      subtitle: "What our retail and wholesale clients say about our fragrances",
      items: [
        { author: "Mohammed F.", text: "Excellent perfumes and genuine attars. Best prices in Indore. Highly recommend their Oud collection.", rating: 5 },
        { author: "Sara K.", text: "The lasting power of their attars is incredible. True luxury experience every time I visit the store.", rating: 5 },
        { author: "Rahul S.", text: "Ordered a custom gift set for a wedding. The packaging and fragrance quality exceeded expectations.", rating: 5 }
      ]
    },
    gallery: {
      title: "Our Visual Story",
      subtitle: "A glimpse into our luxurious store and artistic collections"
    },
    stats: {
      title: "Our Journey In Numbers",
      items: [
        { value: "13+", label: "Years in Business" },
        { value: "5000+", label: "Happy Customers" },
        { value: "500+", label: "Fragrance Recipes" },
        { value: "4.9★", label: "Google Rating" }
      ]
    },
    contact_cta: {
      title: "Experience Luxury Perfumery Firsthand",
      subtitle: "Visit our showroom in Indore to explore custom scent profiles and exquisite gifting boxes.",
      bgImage: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=2500&auto=format&fit=crop",
      buttonText: "Get Store Location",
      buttonLink: "/contact"
    }
  },
  shop: {
    hero: {
      title: "Exquisite Perfume Collection",
      subtitle: "Browse premium long-lasting perfumes, attars, and custom blends.",
      bgImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=2500&auto=format&fit=crop"
    },
    grid: {
      title: "Our Fragrance Gallery",
      subtitle: "Find your signature scent"
    }
  },
  categories: {
    hero: {
      title: "Fragrance Categories",
      subtitle: "Explore our rich and diverse oriental fragrance families.",
      bgImage: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2500&auto=format&fit=crop"
    },
    grid: {
      title: "Scent Categories",
      subtitle: "Discover concentrated attars, elegant spray perfumes, and rich incense."
    }
  },
  about: {
    hero: {
      title: "Our Rich Heritage",
      subtitle: "Where passion meets ancient perfumery tradition.",
      bgImage: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2500&auto=format&fit=crop"
    },
    story: {
      title: "A Journey of Passion & Perfection",
      storyTitle: "Our Humble Beginnings",
      storyText: "Established in 2007 by Mr. Hashim, A.H.R Perfumes began as a small boutique in the historic Bombay Bazar of Indore. Our vision was simple: to bring the authentic, rich heritage of oriental fragrances to connoisseurs who appreciate true luxury.\n\nOver the past decade, we have grown from a local gem to a trusted name in both retail and wholesale fragrance supply across India. Our dedication to sourcing the finest raw materials has remained unwavering.",
      storyImage: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop",
      quoteText: "Fragrance is the invisible, unforgettable, ultimate accessory of fashion.",
      quoteAuthor: "Mr. Hashim, Founder"
    },
    values: {
      title: "Our Core Pillars",
      subtitle: "The principles that define our commitment to fragrance crafting",
      items: [
        { title: "Uncompromising Purity", description: "We strictly use high-grade, authentic ingredients to ensure our attars and perfumes deliver an unadulterated experience.", icon: "Droplet" },
        { title: "Craftsmanship", description: "From blending to bottling, every step of our process is executed with meticulous attention to detail and quality control.", icon: "Award" },
        { title: "Bespoke Passion", description: "Our love for fragrances drives our continuous innovation, leading us to create unique, memorable scent profiles.", icon: "Heart" },
        { title: "Luxury For All", description: "We believe luxury should be experienced by all, offering premium fragrances at fair prices for retail and wholesale.", icon: "Globe" }
      ]
    }
  },
  gallery_page: {
    hero: {
      title: "Our Gallery",
      subtitle: "Visual snapshots of pure luxury and fragrance blending mastery.",
      bgImage: "https://images.unsplash.com/photo-1620021665476-805fd843e987?q=80&w=2500&auto=format&fit=crop"
    },
    grid: {
      title: "Showroom Glimpses",
      subtitle: "Walk through our physical store in Indore and our custom blending setups."
    }
  },
  contact: {
    hero: {
      title: "Visit Our Showroom",
      subtitle: "Experience Indore's finest attars & perfumes in person.",
      bgImage: "https://images.unsplash.com/photo-1620021665476-805fd843e987?q=80&w=2500&auto=format&fit=crop"
    },
    details: {
      title: "Contact Details",
      subtitle: "Reach out to us for premium gifting, retail, and wholesale inquiries.",
      address: "147 Jawahar Marg, Near Minara Masjid, Bombay Bazar, Indore, Madhya Pradesh 452002",
      phone: "+91 99261 80003",
      email: "contact@ahrperfumes.com",
      instagram: "@a.h.r.perfumes_",
      hoursWeekdays: "10:00 AM – 10:00 PM",
      hoursSunday: "Open All Day",
      mapImage: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600",
      mapLocation: "https://www.google.com/maps/embed?pb=!1m17!1m11!1m3!1d189.18932168230114!2d75.85147396175675!3d22.7173571607515!2m2!1f197.08292080320177!2f45!3m2!1i1024!2i768!4f35!3m3!1m2!1s0x3962fda723dabfe5%3A0x5ec561d12950c8ef!2s147%2C%20Jawahar%20Marg%2C%20near%20Nafees%20Bakery%2C%20Bombay%20Bazar%2C%20Indore%2C%20Madhya%20Pradesh%20452002!5e1!3m2!1sen!2sin!4v1783274346871!5m2!1sen!2sin"
    },
    form_section: {
      title: "Send An Inquiry",
      subtitle: "Drop us a message and our team will get back to you within 24 hours.",
      image: "https://images.unsplash.com/photo-1595532545115-4ba972e382bb?q=80&w=1500&auto=format&fit=crop"
    },
    why_visit_us: {
      title: "Why Visit Our Showroom",
      subtitle: "Experience luxury fragrances in a boutique tailored for connoisseurs",
      items: [
        {
          title: "Exclusive Blends",
          description: "Taste and smell private blends reserved exclusively for in-store walk-ins.",
          icon: "Sparkles"
        },
        {
          title: "Bespoke Consulting",
          description: "Receive free, highly personalized consultations to match your personality profile.",
          icon: "UserCheck"
        },
        {
          title: "Purity Testing",
          description: "Verify our premium wood chips and essential oils live at our testing counters.",
          icon: "ShieldAlert"
        },
        {
          title: "Indore's Best Prices",
          description: "Direct wholesale rates on high-grade attars and customized gifting packages.",
          icon: "TrendingDown"
        }
      ]
    }
  }
};

export const useWebsiteContentStore = create<WebsiteContentState>((set) => ({
  homepage: DEFAULT_HOMEPAGE,
  pageImages: DEFAULT_PAGE_IMAGES,
  websiteSections: DEFAULT_WEBSITE_SECTIONS,
  loading: false,
  error: null,

  fetchContent: async () => {
    set({ loading: true });
    try {
      const [homeRes, imagesRes, sectionsRes] = await Promise.all([
        fetch("/api/website-content/homepage"),
        fetch("/api/website-content/page_images"),
        fetch("/api/website-content/website_sections")
      ]);

      let homeData = DEFAULT_HOMEPAGE;
      let imagesData = DEFAULT_PAGE_IMAGES;
      let sectionsData = DEFAULT_WEBSITE_SECTIONS;

      if (homeRes.ok) {
        const d = await homeRes.json();
        if (d && Object.keys(d).length > 0) {
          homeData = { ...DEFAULT_HOMEPAGE, ...d };
        }
      }

      if (imagesRes.ok) {
        const d = await imagesRes.json();
        if (d && Object.keys(d).length > 0) {
          imagesData = { ...DEFAULT_PAGE_IMAGES, ...d };
        }
      }

      if (sectionsRes.ok) {
        const d = await sectionsRes.json();
        if (d && Object.keys(d).length > 0) {
          // Merge deeply to handle new keys gracefully
          sectionsData = {
            ...DEFAULT_WEBSITE_SECTIONS,
            ...d,
            home: {
              ...DEFAULT_WEBSITE_SECTIONS.home,
              ...(d.home || {}),
              hero: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.hero,
                ...(d.home?.hero || {})
              },
              highlights: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.highlights,
                ...(d.home?.highlights || {})
              },
              best_sellers: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.best_sellers,
                ...(d.home?.best_sellers || {})
              },
              categories_section: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.categories_section,
                ...(d.home?.categories_section || {})
              },
              featured_collections: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.featured_collections,
                ...(d.home?.featured_collections || {})
              },
              why_choose_us: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.why_choose_us,
                ...(d.home?.why_choose_us || {})
              },
              testimonials: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.testimonials,
                ...(d.home?.testimonials || {})
              },
              gallery: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.gallery,
                ...(d.home?.gallery || {})
              },
              stats: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.stats,
                ...(d.home?.stats || {})
              },
              contact_cta: {
                ...DEFAULT_WEBSITE_SECTIONS.home?.contact_cta,
                ...(d.home?.contact_cta || {})
              }
            },
            shop: {
              ...DEFAULT_WEBSITE_SECTIONS.shop,
              ...(d.shop || {}),
              hero: {
                ...DEFAULT_WEBSITE_SECTIONS.shop?.hero,
                ...(d.shop?.hero || {})
              },
              grid: {
                ...DEFAULT_WEBSITE_SECTIONS.shop?.grid,
                ...(d.shop?.grid || {})
              }
            },
            categories: {
              ...DEFAULT_WEBSITE_SECTIONS.categories,
              ...(d.categories || {}),
              hero: {
                ...DEFAULT_WEBSITE_SECTIONS.categories?.hero,
                ...(d.categories?.hero || {})
              },
              grid: {
                ...DEFAULT_WEBSITE_SECTIONS.categories?.grid,
                ...(d.categories?.grid || {})
              }
            },
            about: {
              ...DEFAULT_WEBSITE_SECTIONS.about,
              ...(d.about || {}),
              hero: {
                ...DEFAULT_WEBSITE_SECTIONS.about?.hero,
                ...(d.about?.hero || {})
              },
              story: {
                ...DEFAULT_WEBSITE_SECTIONS.about?.story,
                ...(d.about?.story || {})
              },
              values: {
                ...DEFAULT_WEBSITE_SECTIONS.about?.values,
                ...(d.about?.values || {})
              }
            },
            gallery_page: {
              ...DEFAULT_WEBSITE_SECTIONS.gallery_page,
              ...(d.gallery_page || {}),
              hero: {
                ...DEFAULT_WEBSITE_SECTIONS.gallery_page?.hero,
                ...(d.gallery_page?.hero || {})
              },
              grid: {
                ...DEFAULT_WEBSITE_SECTIONS.gallery_page?.grid,
                ...(d.gallery_page?.grid || {})
              }
            },
            contact: {
              ...DEFAULT_WEBSITE_SECTIONS.contact,
              ...(d.contact || {}),
              hero: {
                ...DEFAULT_WEBSITE_SECTIONS.contact?.hero,
                ...(d.contact?.hero || {})
              },
              details: {
                ...DEFAULT_WEBSITE_SECTIONS.contact?.details,
                ...(d.contact?.details || {})
              },
              form_section: {
                ...DEFAULT_WEBSITE_SECTIONS.contact?.form_section,
                ...(d.contact?.form_section || {})
              }
            }
          };
        }
      }

      set({ homepage: homeData, pageImages: imagesData, websiteSections: sectionsData, loading: false, error: null });
    } catch (err: any) {
      console.warn("Error fetching website content, using defaults:", err);
      set({ loading: false });
    }
  },

  updateHomepage: async (payload) => {
    set({ loading: true });
    try {
      const res = await fetch("/api/website-content/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save homepage settings.");
      set({ homepage: payload, loading: false, error: null });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updatePageImages: async (payload) => {
    set({ loading: true });
    try {
      const res = await fetch("/api/website-content/page_images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save page image configurations.");
      set({ pageImages: payload, loading: false, error: null });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateWebsiteSections: async (payload) => {
    set({ loading: true });
    try {
      const res = await fetch("/api/website-content/website_sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save website section content.");
      set({ websiteSections: payload, loading: false, error: null });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
