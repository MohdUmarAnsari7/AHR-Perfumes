export const businessInfo = {
  name: "AHR Perfumes",
  tagline: "Where Every Scent Tells a Story",
  established: 2007,
  address: "147 Jawahar Marg, Near Minara Masjid, Bombay Bazar, Indore, Madhya Pradesh 452002",
  phone: "+91 99261 80003",
  email: "contact@ahrperfumes.com",
  instagram: "@a.h.r.perfumes_",
  owner: "Mr. Zakir",
  rating: "4.9",
  yearsInBusiness: "15+",
  happyCustomers: "10,000+",
  totalProducts: "120+",
  hours: {
    weekdays: "10:00 AM – 10:00 PM",
    sunday: "Open All Day"
  }
};

export const faqs: Array<{ question: string; answer: string }> = [];

export const visitReasons: Array<{ title: string; description: string; icon: string }> = [];

export const inquiryOptions = [
  "General Inquiry",
  "Retail Purchase",
  "Wholesale Inquiry",
  "Bulk Order",
  "Corporate Gifting",
  "Product Information",
  "Partnership",
  "Other"
];

export const heroSlides: Array<{
  id: number;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
}> = [];

export const featureHighlights: Array<{
  icon: string;
  title: string;
  description: string;
}> = [];

export const products: Array<{
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  isBestSeller: boolean;
}> = [];

export const categories: Array<{
  title: string;
  description: string;
  image: string;
}> = [];

export const featuredCollections: string[] = [];

export const whyChooseUs: string[] = [];

export const testimonials: Array<{
  id: number;
  rating: number;
  text: string;
  author: string;
}> = [];

export const galleryImages: string[] = [];
