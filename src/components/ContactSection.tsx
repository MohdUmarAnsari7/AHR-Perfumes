import { MapPin, Phone, Mail, Instagram, Clock } from "lucide-react";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function ContactSection() {
  const info = useBusinessInfoStore((state) => state.info);
  const { websiteSections } = useWebsiteContentStore();

  const details = websiteSections?.contact?.details || {
    title: "Get In Touch",
    subtitle: "We'd love to hear from you. For inquiries about our collections, wholesale orders, or customized gifting.",
    address: info.address || "147 Jawahar Marg, Near Minara Masjid, Bombay Bazar, Indore, Madhya Pradesh 452002",
    phone: info.phone || "+91 99261 80003",
    email: info.email || "contact@ahrperfumes.com",
    instagram: info.instagram || "@a.h.r.perfumes_",
    hoursWeekdays: "10:00 AM – 10:00 PM",
    hoursSunday: "Open All Day"
  };

  const formSection = websiteSections?.contact?.form_section || {
    title: "Send a Message",
    subtitle: "Drop us a message and our team will get back to you within 24 hours."
  };

  return (
    <section className="py-12 bg-[#FAF9F6] border-t border-gray-200">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="text-center mb-8">
           <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl text-gray-900 mb-3">{details.title}</h2>
           <div className="w-16 h-1 bg-gold-primary mx-auto mb-4"></div>
           <p className="text-gray-600 text-xs sm:text-sm max-w-2xl mx-auto">{details.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Contact Details */}
          <div className="space-y-8 sm:space-y-12">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-gold-accent mb-6">Visit Our Store</h3>
              <ul className="space-y-5 sm:space-y-6 text-gray-700">
                <li className="flex items-start group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex items-center justify-center mr-3 sm:mr-4 group-hover:border-gold-primary transition-colors flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold-primary" />
                  </div>
                  <div className="pt-1.5 sm:pt-3">
                    <p className="font-medium text-xs sm:text-sm text-gray-900 mb-0.5 sm:mb-1">Address</p>
                    <p className="text-xs sm:text-sm leading-relaxed">{details.address}</p>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex items-center justify-center mr-3 sm:mr-4 group-hover:border-gold-primary transition-colors flex-shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gold-primary" />
                  </div>
                  <div className="pt-1.5 sm:pt-3">
                    <p className="font-medium text-xs sm:text-sm text-gray-900 mb-0.5 sm:mb-1">Business Hours</p>
                    <p className="text-xs sm:text-sm leading-relaxed">Mon - Sat: {details.hoursWeekdays}<br/>Sun: {details.hoursSunday}</p>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex items-center justify-center mr-3 sm:mr-4 group-hover:border-gold-primary transition-colors flex-shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gold-primary" />
                  </div>
                  <div className="pt-1.5 sm:pt-3">
                    <p className="font-medium text-xs sm:text-sm text-gray-900 mb-0.5 sm:mb-1">Phone / WhatsApp</p>
                    <p className="text-xs sm:text-sm leading-relaxed">{details.phone}</p>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex items-center justify-center mr-3 sm:mr-4 group-hover:border-gold-primary transition-colors flex-shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gold-primary" />
                  </div>
                  <div className="pt-1.5 sm:pt-3">
                    <p className="font-medium text-xs sm:text-sm text-gray-900 mb-0.5 sm:mb-1">Email</p>
                    <p className="text-xs sm:text-sm leading-relaxed">{details.email}</p>
                  </div>
                </li>
                <li className="flex items-start group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-200 flex items-center justify-center mr-3 sm:mr-4 group-hover:border-gold-primary transition-colors flex-shrink-0">
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-gold-primary" />
                  </div>
                  <div className="pt-1.5 sm:pt-3">
                    <p className="font-medium text-xs sm:text-sm text-gray-900 mb-0.5 sm:mb-1">Instagram</p>
                    <p className="text-xs sm:text-sm leading-relaxed">{details.instagram}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-5 sm:p-8 md:p-10 border border-gray-200">
            <h3 className="font-serif text-xl sm:text-2xl text-gray-900 mb-2">{formSection.title}</h3>
            <p className="text-[11px] sm:text-xs text-neutral-500 mb-6 sm:mb-8">{formSection.subtitle}</p>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                   <label htmlFor="name" className="block text-xs tracking-widest text-gray-600 uppercase mb-2">Name</label>
                   <input type="text" id="name" className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-gold-primary transition-colors" />
                 </div>
                 <div>
                   <label htmlFor="phone" className="block text-xs tracking-widest text-gray-600 uppercase mb-2">Phone</label>
                   <input type="text" id="phone" className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-gold-primary transition-colors" />
                 </div>
              </div>
              <div>
                 <label htmlFor="email" className="block text-xs tracking-widest text-gray-600 uppercase mb-2">Email</label>
                 <input type="email" id="email" className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-gold-primary transition-colors" />
              </div>
              <div>
                 <label htmlFor="message" className="block text-xs tracking-widest text-gray-600 uppercase mb-2">Message</label>
                 <textarea id="message" rows={4} className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-gold-primary transition-colors resize-none"></textarea>
              </div>
              <button type="submit" className="w-full bg-gold-primary text-black font-semibold uppercase tracking-widest text-sm py-4 hover:bg-gold-accent transition-colors">
                Submit Inquiry
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
