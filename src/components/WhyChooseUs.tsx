import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function WhyChooseUs() {
  const { websiteSections } = useWebsiteContentStore();

  const title = websiteSections?.home?.why_choose_us?.title || "A Legacy of Fine Fragrances";
  const subtitle = websiteSections?.home?.why_choose_us?.subtitle || "What makes A.H.R Perfumes Indore's premium fragrance brand";
  const reasons = websiteSections?.home?.why_choose_us?.reasons || [
    { title: "Pure Ingredients", description: "Absolutely zero harmful chemicals or adulteration in our pure oil concentrates." },
    { title: "Exceptional Performance", description: "Carefully formulated to offer legendary sillage, longevity, and memory." },
    { title: "Indore's Heritage", description: "Serving fragrance lovers since 2007 from our iconic Bombay Bazar boutique." },
    { title: "Custom Blending", description: "Speak with our founder, Mr. Hashim, to create a personalized fragrance recipe." }
  ];

  return (
    <section className="py-12 bg-white border-y border-[#F0EAE1]">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Image Side */}
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden border border-[#F0EAE1]">
               <img 
                 src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=1000&auto=format&fit=crop" 
                 alt="Why choose us" 
                 className="w-full h-full object-cover opacity-80"
                 referrerPolicy="no-referrer"
               />
            </div>
            <div className="absolute -bottom-8 -right-8 w-64 h-64 border border-gold-primary -z-10 hidden md:block"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur border border-gray-200 p-8 text-center hidden md:block">
               <span className="block font-serif text-5xl text-gold-accent mb-2">13+</span>
               <span className="block text-sm tracking-widest uppercase text-gray-700">Years of</span>
               <span className="block text-sm tracking-widest uppercase text-gray-700">Excellence</span>
            </div>
          </div>

          {/* Content Side */}
          <div>
            <h2 className="font-serif text-3xl md:text-5xl text-gray-900 mb-2">{title}</h2>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4">{subtitle}</p>
            <div className="w-24 h-1 bg-gold-primary mb-6"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex flex-col bg-[#FAF9F6] border border-[#F0EAE1] p-5 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-primary/20 flex items-center justify-center mr-3 border border-gold-primary/30">
                      <Check className="w-3.5 h-3.5 text-gold-primary" />
                    </div>
                    <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider">{reason.title}</h3>
                  </div>
                  <p className="text-neutral-500 text-xs font-light leading-relaxed pl-9">{reason.description}</p>
                </div>
              ))}
            </div>

            <div>
               <Link 
                 to="/about"
                 className="inline-block bg-transparent border border-gray-900 text-gray-900 px-8 py-3 uppercase tracking-widest text-xs font-semibold hover:bg-gold-primary hover:text-black hover:border-gold-primary transition-all duration-300"
               >
                 Read Our Story
               </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
