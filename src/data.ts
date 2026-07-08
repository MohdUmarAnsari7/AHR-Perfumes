export const businessInfo = {
  name: "My Scent Boutique",
  tagline: "Where Every Scent Tells a Story",
  established: 2026,
  address: "",
  phone: "",
  email: "",
  instagram: "",
  owner: "",
  rating: "5.0",
  yearsInBusiness: "0+",
  happyCustomers: "0+",
  totalProducts: "0+",
  hours: {
    weekdays: "",
    sunday: ""
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
