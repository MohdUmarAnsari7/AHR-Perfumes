import { Helmet } from "react-helmet-async";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { motion } from "motion/react";
import { Droplet, Award, Globe, Heart } from "lucide-react";

export default function About() {
  const info = useBusinessInfoStore((state) => state.info);
  const { websiteSections } = useWebsiteContentStore();

  const hero = websiteSections?.about?.hero || {
    title: "Our Rich Heritage",
    subtitle: "Where passion meets ancient perfumery tradition.",
    bgImage: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2500&auto=format&fit=crop"
  };

  const story = websiteSections?.about?.story || {
    title: "A Journey of Passion & Perfection",
    storyTitle: "Our Humble Beginnings",
    storyText: "Established in 2007 by Mr. Hashim, A.H.R Perfumes began as a small boutique in the historic Bombay Bazar of Indore. Our vision was simple: to bring the authentic, rich heritage of oriental fragrances to connoisseurs who appreciate true luxury.\n\nOver the past decade, we have grown from a local gem to a trusted name in both retail and wholesale fragrance supply across India. Our dedication to sourcing the finest raw materials has remained unwavering.",
    storyImage: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop",
    quoteText: "Fragrance is the invisible, unforgettable, ultimate accessory of fashion.",
    quoteAuthor: "Mr. Hashim, Founder"
  };

  const values = websiteSections?.about?.values || {
    title: "Our Core Pillars",
    subtitle: "The principles that define our commitment to fragrance crafting",
    items: [
      { title: "Uncompromising Purity", description: "We strictly use high-grade, authentic ingredients to ensure our attars and perfumes deliver an unadulterated experience.", icon: "Droplet" },
      { title: "Craftsmanship", description: "From blending to bottling, every step of our process is executed with meticulous attention to detail and quality control.", icon: "Award" },
      { title: "Bespoke Passion", description: "Our love for fragrances drives our continuous innovation, leading us to create unique, memorable scent profiles.", icon: "Heart" },
      { title: "Luxury For All", description: "We believe luxury should be experienced by all, offering premium fragrances at fair prices for retail and wholesale.", icon: "Globe" }
    ]
  };

  // Helper to render lucide icon dynamically
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Droplet": return <Droplet className="w-8 h-8 text-gold-primary" />;
      case "Award": return <Award className="w-8 h-8 text-gold-primary" />;
      case "Globe": return <Globe className="w-8 h-8 text-gold-primary" />;
      case "Heart": return <Heart className="w-8 h-8 text-gold-primary" />;
      default: return <Droplet className="w-8 h-8 text-gold-primary" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Our Story | {info.name}</title>
        <meta name="description" content="Discover the heritage and passion behind A.H.R Perfumes. Crafting luxury fragrances, attars, and perfumes since 2007." />
      </Helmet>

      {/* Hero */}
      <section className="relative w-full h-[140px] sm:h-[180px] md:h-[35vh] xl:h-[50vh] flex items-center justify-center overflow-hidden bg-neutral-900 mt-[64px] sm:mt-[72px]">
        <div className="absolute inset-0">
          <img
            src={hero.bgImage || undefined}
            alt={hero.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-gold-accent tracking-widest uppercase text-[9px] sm:text-xs mb-1 sm:mb-3 font-semibold"
          >
            Since {info.established || "2007"}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-2xl sm:text-4xl md:text-6xl text-white mb-2 sm:mb-4 uppercase tracking-widest leading-snug drop-shadow-md"
          >
            {hero.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-neutral-200 text-[10px] sm:text-sm md:text-lg font-light leading-relaxed max-w-xl mx-auto"
          >
            {hero.subtitle}
          </motion.p>
        </div>
      </section>

      {/* Story Content */}
      <section className="py-8 sm:py-16 md:py-24 bg-[#FAF9F6] relative border-b border-[#F0EAE1]">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 relative max-w-sm sm:max-w-md mx-auto w-full mt-4 lg:mt-0">
              <div className="aspect-[4/5] bg-white border border-[#F0EAE1] p-2 sm:p-3 rounded-2xl shadow-xs">
                <div className="w-full h-full overflow-hidden relative border border-gray-200/50 rounded-lg">
                  <img 
                    src={story.storyImage || undefined} 
                    alt="Our Story" 
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              {story.quoteText && (
                <div className="absolute -bottom-8 -right-8 bg-white border border-gold-primary p-6 lg:p-8 hidden md:block max-w-sm rounded-xl shadow-md">
                  <p className="font-serif text-sm text-gray-900 italic">"{story.quoteText}"</p>
                  <div className="mt-4 text-gold-accent uppercase tracking-widest text-xs font-semibold">— {story.quoteAuthor}</div>
                </div>
              )}
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-gray-900 mb-1 sm:mb-2 leading-tight">{story.title}</h2>
              <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest mb-4">{story.storyTitle}</p>
              <div className="w-16 sm:w-20 h-0.5 sm:h-1 bg-gold-primary mb-5 sm:mb-8"></div>
              
              <div className="space-y-4 sm:space-y-6 text-stone-600 font-light leading-relaxed text-xs sm:text-base whitespace-pre-wrap">
                {story.storyText}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-8 sm:py-16 bg-white">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-gray-900 mb-1 sm:mb-2">{values.title}</h2>
            <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-widest mb-4">{values.subtitle}</p>
            <div className="w-16 sm:w-24 h-0.5 sm:h-1 bg-gold-primary mx-auto"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
            {values.items.map((val: any, idx: number) => (
              <div key={idx} className="bg-[#FAF9F6] border border-[#F0EAE1] p-4 sm:p-8 rounded-2xl hover:border-gold-primary/30 transition-all text-center flex flex-col items-center justify-between">
                <div>
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gold-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-6 border border-gold-primary/20">
                    <div className="scale-75 sm:scale-100 flex items-center justify-center">
                      {renderIcon(val.icon)}
                    </div>
                  </div>
                  <h3 className="font-serif text-xs sm:text-xl text-gray-900 mb-1.5 sm:mb-3 font-semibold leading-tight">{val.title}</h3>
                  <p className="text-stone-500 text-[10px] sm:text-xs leading-relaxed font-light line-clamp-3 sm:line-clamp-none">{val.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
