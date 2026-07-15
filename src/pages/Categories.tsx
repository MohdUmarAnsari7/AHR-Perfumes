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
            src={categoriesHero.bgImage || null}
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-8">
              {loadedCategories.map((category, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  key={category.title} 
                  className="flex flex-col group"
                >
                  <Link 
                    to={`/shop?category=${encodeURIComponent(category.title)}`} 
                    className="relative aspect-[3/4] sm:aspect-[16/10] overflow-hidden bg-neutral-900 border border-gray-200 block rounded-xl sm:rounded-none shadow-xs hover:shadow-md transition-shadow duration-300"
                  >
                    <img 
                      src={category.image || null} 
                      alt={category.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-95"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
                  </Link>
                  
                  <div className="mt-3 sm:mt-5 text-center px-1">
                    <Link 
                      to={`/shop?category=${encodeURIComponent(category.title)}`}
                      className="hover:text-gold-accent transition-colors block"
                    >
                      <h3 className="font-serif text-sm sm:text-xl md:text-3xl text-stone-900 font-bold uppercase tracking-wider leading-tight">
                        {category.title}
                      </h3>
                    </Link>
                    {category.description && (
                      <p className="text-stone-500 font-light text-[10px] sm:text-xs md:text-sm mt-1.5 max-w-sm mx-auto line-clamp-1 sm:line-clamp-2">
                        {category.description}
                      </p>
                    )}
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
