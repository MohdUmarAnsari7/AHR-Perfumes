import React from "react";
import * as Icons from "lucide-react";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function WhyVisitUs() {
  const { websiteSections } = useWebsiteContentStore();

  const section = (websiteSections?.contact as any)?.why_visit_us || {
    title: "Why Visit Our Showroom",
    subtitle: "Experience luxury fragrances in a boutique tailored for connoisseurs",
    items: [
      {
        title: "Exclusive Blends",
        description: "Taste and smell private blends reserved exclusively for in-store walk-ins.",
        icon: "Sparkles"
      },
      {
        title: "Bespoke Consulting",
        description: "Receive free, highly personalized consultations to match your personality profile.",
        icon: "UserCheck"
      },
      {
        title: "Purity Testing",
        description: "Verify our premium wood chips and essential oils live at our testing counters.",
        icon: "ShieldAlert"
      },
      {
        title: "Indore's Best Prices",
        description: "Direct wholesale rates on high-grade attars and customized gifting packages.",
        icon: "TrendingDown"
      }
    ]
  };

  return (
    <section className="py-10 bg-white border-t border-[#F0EAE1]">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 mb-8 text-center">
        <h2 className="font-serif text-3xl md:text-5xl text-gray-900 mb-2">{section.title}</h2>
        <p className="text-xs text-neutral-500 uppercase tracking-widest">{section.subtitle}</p>
        <div className="w-24 h-1 bg-gold-primary mx-auto mt-4"></div>
      </div>

      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {section.items.map((reason: any, idx: number) => {
            const Icon = Icons[reason.icon as keyof typeof Icons] as React.ElementType;
            return (
              <div
                key={idx}
                className="group flex flex-col items-center text-center p-8 border border-[#F0EAE1] hover:border-gold-primary transition-all duration-300 bg-white rounded-2xl"
              >
                <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center mb-6 group-hover:bg-white transition-colors bg-[#FAF9F6]">
                  {Icon ? <Icon className="w-6 h-6 text-gold-accent" /> : <Icons.Sparkles className="w-6 h-6 text-gold-accent" />}
                </div>
                <h3 className="font-serif text-xl text-gray-900 mb-3 tracking-wide">{reason.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed font-light">{reason.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
