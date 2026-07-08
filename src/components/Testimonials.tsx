import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star } from "lucide-react";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function Testimonials() {
  const { websiteSections } = useWebsiteContentStore();
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "center", slidesToScroll: 1 });
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/testimonials")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTestimonials(data);
        }
      })
      .catch(err => console.log("Error fetching testimonials:", err));
  }, []);

  const title = websiteSections?.home?.testimonials?.title || "Voices of Satisfaction";
  const subtitle = websiteSections?.home?.testimonials?.subtitle || "What our retail and wholesale clients say about our fragrances";

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-primary/10 via-black to-black opacity-50 -z-10 blur-3xl"></div>

      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center mb-8 relative z-10">
         <h2 className="font-serif text-3xl md:text-5xl text-gray-900 mb-2">{title}</h2>
         <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4">{subtitle}</p>
         <div className="w-24 h-1 bg-gold-primary mx-auto"></div>
      </div>

      <div className="overflow-hidden max-w-4xl mx-auto cursor-grab active:cursor-grabbing" ref={emblaRef}>
        <div className="flex">
          {testimonials.map((t, idx) => (
            <div key={idx} className="flex-[0_0_100%] min-w-0 px-4 flex flex-col items-center text-center">
              <div className="flex space-x-1 mb-8 text-gold-primary">
                {[...Array(t.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="font-serif text-2xl md:text-3xl text-gray-900 leading-relaxed mb-8 italic">
                "{t.text}"
              </p>
              <div className="flex flex-col items-center">
                <span className="text-gold-accent tracking-widest uppercase text-sm font-semibold mb-1">
                  {t.author}
                </span>
                <span className="text-gray-500 text-xs tracking-wider uppercase">Verified Customer</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
