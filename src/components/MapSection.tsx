import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function MapSection() {
  const { websiteSections } = useWebsiteContentStore();
  const locationQuery = websiteSections?.contact?.details?.mapLocation || "https://www.google.com/maps/embed?pb=!1m17!1m11!1m3!1d189.18932168230114!2d75.85147396175675!3d22.7173571607515!2m2!1f197.08292080320177!2f45!3m2!1i1024!2i768!4f35!3m3!1m2!1s0x3962fda723dabfe5%3A0x5ec561d12950c8ef!2s147%2C%20Jawahar%20Marg%2C%20near%20Nafees%20Bakery%2C%20Bombay%20Bazar%2C%20Indore%2C%20Madhya%20Pradesh%20452002!5e1!3m2!1sen!2sin!4v1783274346871!5m2!1sen!2sin";
  
  // If user entered a full iframe URL, embed URL, or full iframe string, extract or use it
  let iframeSrc = "";
  if (locationQuery.includes("<iframe")) {
    const match = locationQuery.match(/src="([^"]+)"/);
    if (match && match[1]) {
      iframeSrc = match[1];
    }
  }

  if (!iframeSrc) {
    if (locationQuery.startsWith("https://") || locationQuery.startsWith("http://")) {
      iframeSrc = locationQuery;
    } else {
      iframeSrc = `https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    }
  }

  return (
    <section className="py-10 bg-[#FAF9F6] border-t border-gray-200">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="text-center mb-8">
           <h2 className="font-serif text-2xl sm:text-3.5xl md:text-4.5xl lg:text-5xl text-gray-900 mb-3 sm:mb-4">Visit Our Store</h2>
           <div className="w-16 sm:w-24 h-0.5 sm:h-1 bg-gold-primary mx-auto"></div>
        </div>

        <div className="relative w-full h-[320px] sm:h-[400px] md:h-[500px] border border-gray-200 rounded-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gold-primary/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay z-10"></div>
          <iframe 
            src={iframeSrc} 
            width="100%" 
            height="100%" 
            style={{ border: 0, filter: 'grayscale(20%) contrast(110%)' }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="A.H.R Perfumes Location"
            className="group-hover:scale-[1.01] transition-transform duration-1000 origin-center"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
