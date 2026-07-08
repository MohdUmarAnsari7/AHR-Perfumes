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

      <section className="relative w-full h-[35vh] md:h-[40vh] xl:h-[50vh] flex items-center justify-center overflow-hidden bg-neutral-900 mt-[72px]">
        <div className="absolute inset-0">
          <img
            src={categoriesHero.bgImage}
            alt={categoriesHero.title}
            className="w-full h-full object-cover opacity-100"
            referrerPolicy="no-referrer"
          />
          {/* Elegant dark overlay to make white text perfectly legible against any background image */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl md:text-5xl text-white mb-2 uppercase tracking-widest drop-shadow-lg"
          >
            {categoriesHero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-white uppercase tracking-widest mb-4 font-semibold drop-shadow-md"
          >
            {categoriesHero.subtitle}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-0.5 bg-gold-primary mx-auto"
          ></motion.div>
        </div>
      </section>

      <section className="py-24 bg-[#FAF9F6]">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {loadedCategories.length === 0 ? (
            <div className="text-center py-20 px-8 bg-white border border-neutral-200 max-w-xl mx-auto rounded-3xl shadow-xs">
              <p className="font-serif text-2xl text-gray-800 uppercase tracking-widest mb-3">Collections Under Curation</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                We are currently redesigning and curating our premium scent categories. Please stay tuned or check back later to browse our bespoke collection groups!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {loadedCategories.map((category, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  key={category.title} 
                  className="relative aspect-[16/10] group overflow-hidden bg-white border border-gray-200 block"
                >
                  <img 
                    src={category.image} 
                    alt={category.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60 group-hover:opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  
                  <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12 flex flex-col justify-end">
                     <h3 className="font-serif text-3xl md:text-4xl text-white mb-4">{category.title}</h3>
                     <p className="text-gray-200 font-light mb-8 max-w-sm">{category.description}</p>
                     <div>
                       <Link to="/shop" className="inline-block bg-white text-gray-900 px-8 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-colors">
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
