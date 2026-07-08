import { motion } from "motion/react";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function ContactHero() {
  const { websiteSections } = useWebsiteContentStore();

  const hero = websiteSections?.contact?.hero || {
    title: "Contact Us",
    subtitle: "We are here to help you discover your perfect fragrance.",
    bgImage: "https://images.unsplash.com/photo-1620021665476-805fd843e987?q=80&w=2500&auto=format&fit=crop"
  };

  return (
    <section className="relative w-full h-[35vh] md:h-[40vh] xl:h-[50vh] flex items-center justify-center overflow-hidden bg-neutral-900 mt-[72px]">
      <div className="absolute inset-0">
        <img
          src={hero.bgImage}
          alt={hero.title}
          className="w-full h-full object-cover opacity-100 scale-100"
          referrerPolicy="no-referrer"
        />
        {/* Subtle dark overlay to ensure text is 100% readable while keeping the image fully visible */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-4xl md:text-6xl text-white mb-4 uppercase tracking-wider drop-shadow-lg"
        >
          {hero.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-white text-sm md:text-base font-light tracking-wide max-w-2xl mx-auto drop-shadow-md"
        >
          {hero.subtitle}
        </motion.p>
      </div>
    </section>
  );
}
