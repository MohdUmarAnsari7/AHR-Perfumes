import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { motion } from "motion/react";
import { Video, Instagram, ExternalLink } from "lucide-react";

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

  const getReelShortcode = (url: string) => {
    if (!url) return "";
    const match = url.match(/(?:instagram\.com\/(?:p|reel|tv)\/)([a-zA-Z0-9_\-]+)/i);
    return match ? match[1] : "";
  };

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
    return cleanUrl.endsWith(".mp4") || cleanUrl.endsWith(".mov") || cleanUrl.endsWith(".webm") || url.includes("video/mp4") || url.includes(".mp4");
  };

  return (
    <>
      <Helmet>
        <title>Instagram Reels Gallery | {info.name}</title>
        <meta name="description" content="Explore our visual gallery of curated Instagram Reels showcasing premium attars, bakhoor, and luxury perfumes from A.H.R Perfumes." />
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
              <Video className="w-12 h-12 text-neutral-300 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="font-serif text-2xl text-gray-900 mb-2">Our Visual Story is curated.</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                No Instagram Reels have been added to the gallery yet. Check back soon or visit our official Instagram page to explore our premium collection.
              </p>
              <a
                href="https://www.instagram.com/a.h.r.perfumes_/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-neutral-900 text-white hover:bg-gold-primary hover:text-black transition-colors px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                <Instagram className="w-4 h-4" />
                <span>Visit Instagram</span>
              </a>
            </motion.div>
          ) : (
            <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
              {loadedImages.map((img, idx) => {
                const instagramUrl = img.instagram_url || img.instagramUrl || img.image_url || img.imageUrl || "";
                const videoUrl = img.image_url || img.imageUrl || "";
                
                const isDirectVideo = isVideoUrl(videoUrl);
                const shortcode = getReelShortcode(instagramUrl);
                
                if (!isDirectVideo && !shortcode) return null;

                const embedUrl = shortcode ? `https://www.instagram.com/reel/${shortcode}/embed/` : "";

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
                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-950">
                      {isDirectVideo ? (
                        /* Native HTML5 Video - 100% clean, autoplay, muted, loops continuously with zero UI */
                        <video
                          src={videoUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                        />
                      ) : (
                        /* Aggressively cropped Instagram embed iframe */
                        <iframe
                          src={embedUrl}
                          className="absolute border-0 select-none pointer-events-none transition-all duration-500 group-hover:scale-102"
                          style={{
                            top: "-20%",
                            left: "-20%",
                            width: "140%",
                            height: "140%",
                          }}
                          scrolling="no"
                          allowFullScreen
                        />
                      )}

                      {/* Transparent overlay that redirects user on click */}
                      <div 
                        onClick={() => window.open(instagramUrl || videoUrl, "_blank")}
                        className="absolute inset-0 z-10 cursor-pointer bg-black/0 hover:bg-black/20 transition-all duration-300 flex flex-col justify-between p-3 sm:p-5"
                      >
                        {/* Hover subtle golden frame accent */}
                        <div className="absolute inset-0 border border-gold-primary/0 group-hover:border-gold-primary/20 rounded-xl sm:rounded-2xl transition-all duration-300 pointer-events-none"></div>

                        {/* Top Right: Gold external link icon */}
                        <div className="self-end bg-[#1E1E1E]/80 backdrop-blur-md text-gold-accent p-1.5 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 shadow-lg border border-gold-primary/10">
                          <ExternalLink className="w-3 sm:w-4 h-3 sm:h-4" />
                        </div>

                        {/* Center: Premium watch indicator button */}
                        <div className="self-center bg-black/75 backdrop-blur-md text-white border border-gold-primary/30 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 transition-all duration-300 flex items-center space-x-2 shadow-xl">
                          <Instagram className="w-3.5 h-3.5 text-gold-accent animate-pulse" />
                          <span className="text-[10px] uppercase tracking-widest font-serif font-semibold text-gold-accent">View Reel</span>
                        </div>

                        {/* Bottom: Minimal aesthetic status badge */}
                        <div className="flex items-center space-x-2 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-full w-fit border border-white/5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-accent animate-pulse"></span>
                          <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-300">
                            {isDirectVideo ? "Loop Feed" : "Instagram Reel"}
                          </span>
                        </div>
                      </div>
                    </div>
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

