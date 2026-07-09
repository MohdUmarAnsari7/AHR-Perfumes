import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { motion } from "motion/react";
import { Camera } from "lucide-react";

export default function Gallery() {
  const [loadedImages, setLoadedImages] = useState<any[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const info = useBusinessInfoStore((state) => state.info);
  const { websiteSections } = useWebsiteContentStore();

  const galleryHero = websiteSections?.gallery_page?.hero || {
    title: "Gallery",
    subtitle: "Explore our masterfully crafted fragrance visually",
    bgImage: "https://images.unsplash.com/photo-1595425984620-1a135fdd6976?q=80&w=2500&auto=format&fit=crop"
  };

  useEffect(() => {
    fetch("/api/gallery-images")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLoadedImages(data);
        }
        setHasFetched(true);
      })
      .catch((err) => {
        console.log("Failed to fetch gallery images:", err);
        setHasFetched(true);
      });
  }, []);

  return (
    <>
      <Helmet>
        <title>Visual Gallery | {info.name}</title>
        <meta name="description" content="Explore our visual gallery of premium attars, bakhoor, and luxury perfumes from A.H.R Perfumes." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative w-full h-[140px] sm:h-[180px] md:h-[35vh] xl:h-[45vh] flex items-center justify-center overflow-hidden bg-neutral-900 mt-[64px] sm:mt-[72px]">
        <div className="absolute inset-0">
          <img
            src={galleryHero.bgImage}
            alt={galleryHero.title}
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/45"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl sm:text-4xl md:text-5xl text-white mb-1.5 sm:mb-3 uppercase tracking-widest font-bold drop-shadow-md"
          >
            {galleryHero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] sm:text-xs md:text-sm text-neutral-200 uppercase tracking-widest mb-3 sm:mb-6 leading-relaxed font-medium drop-shadow-sm"
          >
            {galleryHero.subtitle}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 sm:w-24 h-0.5 bg-gold-primary mx-auto shadow-xs"
          ></motion.div>
        </div>
      </section>

      <section className="py-6 sm:py-16 bg-[#FAF9F6]">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {hasFetched && loadedImages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white border border-[#F0EAE1] max-w-2xl mx-auto px-6 rounded-3xl shadow-xs"
            >
              <Camera className="w-12 h-12 text-neutral-300 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="font-serif text-2xl text-gray-900 mb-2">Our Visual Story is curated.</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                No images have been added to the gallery yet. Check back soon or visit our Instagram to explore our premium collection.
              </p>
            </motion.div>
          ) : (
            <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
              {loadedImages.map((img, idx) => {
                // Organic top-margins to scatter and stagger the masonry column cards
                const offsets = ["mt-0", "mt-3 sm:mt-6", "mt-1.5 sm:mt-3", "mt-4 sm:mt-8"];
                const staggerClass = offsets[idx % offsets.length];

                return (
                  <motion.div 
                    key={img.id || idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.5, delay: (idx % 3) * 0.05 }}
                    className={`break-inside-avoid relative group overflow-hidden bg-white rounded-xl sm:rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 ${staggerClass}`}
                  >
                    <a 
                      href={img.instagram_url || img.instagramUrl || "https://www.instagram.com/a.h.r.perfumes_/"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block overflow-hidden relative rounded-xl sm:rounded-2xl"
                    >
                      <img 
                        src={img.image_url || img.imageUrl} 
                        alt="Gallery Visual" 
                        className="w-full h-auto object-cover opacity-95 group-hover:opacity-100 group-hover:scale-104 transition-all duration-700 rounded-xl sm:rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl sm:rounded-2xl" />
                    </a>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
