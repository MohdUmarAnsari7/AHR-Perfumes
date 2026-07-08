import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function FeaturedCollections() {
  const [activeTab, setActiveTab] = useState(0);
  const { websiteSections } = useWebsiteContentStore();

  const title = websiteSections?.home?.featured_collections?.title || "Featured Collections";
  const subtitle = websiteSections?.home?.featured_collections?.subtitle || "Explore our masterfully blended fragrance chapters";
  const tabs = websiteSections?.home?.featured_collections?.tabs || [
    {
      tabName: "Oud & Woods",
      title: "The Royal Dehn Al Oud",
      description: "A rich, deep, and majestic collection of authentic ouds sourced from across Southeast Asia, perfect for grand occasions.",
      image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2500&auto=format&fit=crop",
      buttonText: "Explore Oud",
      buttonLink: "/shop"
    },
    {
      tabName: "Musk & Rose",
      title: "Pure Musk & Taifi Rose",
      description: "Delicate, clean musk paired with fresh taifi rose petals to deliver an elegant, clean, and refreshing trail that lasts all day.",
      image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2500&auto=format&fit=crop",
      buttonText: "Shop Soft Scents",
      buttonLink: "/shop"
    },
    {
      tabName: "Luxury Sprays",
      title: "Modern Premium Perfumes",
      description: "Our signature French-style Eau de Parfums blended with rich oriental heart notes for unmatched projection and sillage.",
      image: "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=2500&auto=format&fit=crop",
      buttonText: "Explore Sprays",
      buttonLink: "/shop"
    },
    {
      tabName: "Exquisite Gifts",
      title: "Custom Gifting Sets",
      description: "Beautifully packaged bespoke fragrance boxes including attar bottles, wood chips, and customized notes for your loved ones.",
      image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=2500&auto=format&fit=crop",
      buttonText: "Order Gift Set",
      buttonLink: "/contact"
    }
  ];

  if (tabs.length === 0) return null;
  const currentTab = tabs[activeTab] || tabs[0];

  return (
    <section className="py-12 bg-[#FAF9F6] border-t border-[#F0EAE1]">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center mb-8">
         <h2 className="font-serif text-3xl md:text-5xl text-gray-900 mb-2">{title}</h2>
         <p className="text-xs text-neutral-500 uppercase tracking-widest mb-6">{subtitle}</p>
         
         <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`text-sm uppercase tracking-widest pb-2 relative transition-colors ${
                  activeTab === idx ? "text-gold-accent font-bold" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.tabName}
                {activeTab === idx && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-primary"
                  />
                )}
              </button>
            ))}
         </div>
      </div>

      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="relative aspect-[21/9] bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
               <img 
                 src={currentTab.image} 
                 alt={currentTab.title} 
                 className="w-full h-full object-cover opacity-90"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]"></div>
            </motion.div>

            <div className="relative z-10 text-center p-8 max-w-3xl">
              <h3 className="font-serif text-3xl md:text-5xl text-white mb-4 uppercase tracking-widest">
                {currentTab.title}
              </h3>
              <p className="text-gray-200 text-sm md:text-base font-light mb-8 max-w-xl mx-auto leading-relaxed">
                {currentTab.description}
              </p>
              <Link 
                to={currentTab.buttonLink || "/shop"}
                className="inline-block border border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-black px-8 py-3 uppercase tracking-widest text-xs font-bold transition-all backdrop-blur-md bg-white/10 shadow-lg"
              >
                {currentTab.buttonText || "Explore The Collection"}
              </Link>
            </div>
        </div>
      </div>
    </section>
  );
}
