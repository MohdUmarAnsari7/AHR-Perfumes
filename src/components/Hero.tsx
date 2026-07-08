import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { websiteSections } = useWebsiteContentStore();

  const slides = websiteSections?.home?.hero?.slides || [
    {
      title: "Premium Attars Crafted With Tradition",
      subtitle: "A.H.R Perfumes",
      buttonText: "Explore Collection",
      buttonLink: "/shop",
      image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop"
    }
  ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  if (slides.length === 0) return null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
          className="absolute inset-0"
        >
          {/* Image */}
          <div className="absolute inset-0">
            {/* Desktop Banner Image */}
            <img
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              className={`w-full h-full object-cover opacity-60 ${slides[currentSlide].mobileImage ? "hidden md:block" : "block"}`}
              referrerPolicy="no-referrer"
            />
            {/* Mobile Banner Image */}
            {slides[currentSlide].mobileImage && (
              <img
                src={slides[currentSlide].mobileImage}
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover opacity-60 md:hidden block"
                referrerPolicy="no-referrer"
              />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center justify-center text-center">
            <div className="max-w-4xl px-4 sm:px-6 lg:px-8 mt-20">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="uppercase tracking-[0.3em] text-gold-accent mb-6 text-sm font-medium"
              >
                {slides[currentSlide].subtitle}
              </motion.p>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif text-white mb-10 leading-tight"
              >
                {slides[currentSlide].title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <Link 
                  to={slides[currentSlide].buttonLink || "/shop"}
                  className="inline-block bg-gold-primary text-black px-10 py-4 uppercase tracking-widest text-xs font-semibold hover:bg-gold-accent transition-colors"
                >
                  {slides[currentSlide].buttonText}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-10 inset-x-0 flex justify-center space-x-12 z-10">
          <button onClick={prevSlide} className="text-white hover:text-gold-primary transition-colors">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <div className="flex items-center space-x-3">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1 transition-all duration-500 bg-white ${
                  i === currentSlide ? "w-8 opacity-100" : "w-3 opacity-30"
                }`}
              />
            ))}
          </div>
          <button onClick={nextSlide} className="text-white hover:text-gold-primary transition-colors">
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
