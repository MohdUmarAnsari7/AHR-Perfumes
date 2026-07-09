import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function Categories() {
  const [loadedCategories, setLoadedCategories] = useState<any[]>([]);
  const info = useBusinessInfoStore((state) => state.info);
  const { websiteSections } = useWebsiteContentStore();

  const categoriesHero = websiteSections?.categories?.hero || {
    title: "Categories",
    subtitle: "Explore Indore's Premium Fragrance Offerings",
    bgImage: "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=2500&auto=format&fit=crop"
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLoadedCategories(data);
        }
      })
      .catch((err) => console.log("Falling back to static categories:", err));
  }, []);

  return (
    <>
      <Helmet>
        <title>Fragrance Categories | {info.name}</title>
        <meta name="description" content="Browse our luxury fragrance categories including Attars, Perfumes, Bakhoor, and Gift Sets." />
      </Helmet>

      <section className="relative w-full h-[140px] sm:h-[180px] md:h-[35vh] xl:h-[45vh] flex items-center justify-center overflow-hidden bg-neutral-900 mt-[64px] sm:mt-[72px]">
        <div className="absolute inset-0">
          <img
            src={categoriesHero.bgImage}
            alt={categoriesHero.title}
            className="w-full h-full object-cover opacity-100"
            referrerPolicy="no-referrer"
          />
          {/* Elegant dark overlay to make white text perfectly legible against any background image */}
          <div className="absolute inset-0 bg-black/45"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl sm:text-4xl md:text-5xl text-white mb-1.5 uppercase tracking-widest leading-snug drop-shadow-md"
          >
            {categoriesHero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] sm:text-xs md:text-sm text-stone-200 uppercase tracking-widest mb-3 leading-relaxed drop-shadow-sm font-semibold"
          >
            {categoriesHero.subtitle}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 sm:w-24 h-0.5 bg-gold-primary mx-auto"
          ></motion.div>
        </div>
      </section>

      <section className="py-6 sm:py-16 md:py-24 bg-[#FAF9F6]">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {loadedCategories.length === 0 ? (
            <div className="text-center py-12 px-6 sm:py-20 sm:px-8 bg-white border border-neutral-200 max-w-xl mx-auto rounded-3xl shadow-xs">
              <p className="font-serif text-xl sm:text-2xl text-gray-800 uppercase tracking-widest mb-3">Collections Under Curation</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                We are currently redesigning and curating our premium scent categories. Please stay tuned or check back later to browse our bespoke collection groups!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-8">
              {loadedCategories.map((category, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  key={category.title} 
                  className="relative aspect-[16/10] group overflow-hidden bg-white border border-gray-200 block rounded-xl sm:rounded-none"
                >
                  <img 
                    src={category.image} 
                    alt={category.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60 group-hover:opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-10 flex flex-col justify-end">
                     <h3 className="font-serif text-xl sm:text-2xl md:text-4xl text-white mb-1.5 sm:mb-4">{category.title}</h3>
                     <p className="text-gray-200 font-light text-[11px] sm:text-xs md:text-base mb-4 sm:mb-8 max-w-sm line-clamp-2 sm:line-clamp-none">{category.description}</p>
                     <div>
                       <Link to={`/shop?category=${encodeURIComponent(category.title)}`} className="inline-block bg-white hover:bg-gold-primary text-gray-900 hover:text-white px-5 py-2 sm:px-8 sm:py-3 text-xs sm:text-sm font-semibold uppercase tracking-widest transition-colors rounded-sm shadow-xs">
                         Shop Now
                       </Link>
                     </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
