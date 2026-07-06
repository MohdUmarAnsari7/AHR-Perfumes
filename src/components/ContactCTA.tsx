import { Phone, MessageCircle } from "lucide-react";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function ContactCTA() {
  const info = useBusinessInfoStore((state) => state.info);
  const { websiteSections } = useWebsiteContentStore();

  const title = websiteSections?.home?.contact_cta?.title || "Discover Your Signature Fragrance";
  const subtitle = websiteSections?.home?.contact_cta?.subtitle || "Visit our store or contact us for personalized recommendations from our fragrance experts.";
  const bgImage = websiteSections?.home?.contact_cta?.bgImage || "https://images.unsplash.com/photo-1620021665476-805fd843e987?q=80&w=2500&auto=format&fit=crop";

  return (
    <section className="relative py-10 bg-white overflow-hidden flex items-center justify-center text-center">
      <div className="absolute inset-0">
        <img 
          src={bgImage} 
          alt="Contact CTA Background" 
          className="w-full h-full object-cover opacity-100"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/45"></div>
      </div>
      
      <div className="relative z-10 max-w-3xl px-4 sm:px-6 lg:px-8 mx-auto">
        <h2 className="font-serif text-3xl md:text-5xl text-white mb-4 uppercase tracking-widest leading-tight">{title}</h2>
        <p className="text-gray-300 mb-6 text-sm md:text-base font-light leading-relaxed max-w-xl mx-auto">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <a
            href={`tel:${info.phone.replace(/[^0-9+]/g, "")}`}
            className="w-full sm:w-auto bg-white text-black px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Now
          </a>
          <a
            href={`https://wa.me/${info.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto border border-gold-primary text-gold-accent px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-primary hover:text-black transition-colors flex items-center justify-center"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  );
}
