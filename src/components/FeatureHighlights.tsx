import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { featureHighlights } from "../data";
import * as Icons from "lucide-react";
import React from "react";

export function FeatureHighlights() {
  const { websiteSections } = useWebsiteContentStore();
  const highlights = websiteSections?.home?.highlights?.items || featureHighlights;
  const sectionTitle = websiteSections?.home?.highlights?.title;
  const sectionSubtitle = websiteSections?.home?.highlights?.subtitle;

  return (
    <section className="py-10 bg-[#FAF9F6] border-b border-gray-200">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {sectionTitle && (
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-gray-900 mb-2 tracking-wide uppercase">
              {sectionTitle}
            </h2>
            {sectionSubtitle && (
              <p className="text-gray-500 text-xs sm:text-sm tracking-widest uppercase">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-10">
          {highlights.map((feature, idx) => {
            const Icon = Icons[feature.icon as keyof typeof Icons] as React.ElementType;
            return (
              <div
                key={idx}
                className="group flex flex-col items-center text-center p-4 sm:p-6 bg-white border border-gray-200 hover:border-gold-primary transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-4 sm:mb-6 group-hover:border-gold-primary transition-colors">
                  {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold-accent" />}
                </div>
                <h3 className="font-serif text-sm sm:text-base md:text-xl text-gray-900 mb-2 sm:mb-3 tracking-wide">{feature.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
