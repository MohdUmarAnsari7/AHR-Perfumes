import { motion } from "motion/react";
import { MapPin, Phone, Instagram, Clock } from "lucide-react";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function ContactInfo() {
  const info = useBusinessInfoStore((state) => state.info);
  const { websiteSections } = useWebsiteContentStore();

  const details = websiteSections?.contact?.details || {
    title: "Get In Touch",
    subtitle: "Whether you are looking for premium attars, luxury perfumes, wholesale fragrance solutions, or personalized recommendations, our team is ready to assist you.",
    address: info.address || "147 Jawahar Marg, Near Minara Masjid, Bombay Bazar, Indore, Madhya Pradesh 452002",
    phone: info.phone || "+91 99261 80003",
    email: info.email || "contact@ahrperfumes.com",
    instagram: info.instagram || "@a.h.r.perfumes_",
    hoursWeekdays: "10:00 AM – 10:00 PM",
    hoursSunday: "Open All Day",
    mapImage: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600",
    mapLocation: "147 Jawahar Marg, Near Minara Masjid, Bombay Bazar, Indore, Madhya Pradesh 452002"
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6 }
    }
  };

  return (
    <section className="py-10 bg-[#FAF9F6] border-b border-[#F0EAE1]">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="text-center mb-8">
           <h2 className="font-serif text-3xl md:text-5xl text-gray-900 mb-6">{details.title}</h2>
           <div className="w-24 h-1 bg-gold-primary mx-auto mb-8"></div>
           <p className="text-gray-600 max-w-2xl mx-auto text-lg font-light leading-relaxed">
             {details.subtitle}
           </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {/* Card 1: Location */}
          <motion.div variants={itemVariants} className="group relative bg-white border border-[#F0EAE1] p-8 flex flex-col items-center text-center overflow-hidden transition-all duration-500 hover:border-gold-primary rounded-2xl">
            <div className="absolute inset-0 bg-gold-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center mb-6 group-hover:border-gold-primary transition-colors bg-white">
              <MapPin className="w-6 h-6 text-gold-accent" />
            </div>
            <p className="text-gray-900 font-serif text-xl mb-4">Location</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow">
              {details.address.split(", ").map((line: string, i: number) => (
                <span key={i} className="block">{line}</span>
              ))}
            </p>
            <a 
              href={details.mapLocation ? (details.mapLocation.startsWith("http") ? details.mapLocation : `https://maps.google.com/?q=${encodeURIComponent(details.mapLocation)}`) : `https://maps.google.com/?q=${encodeURIComponent(details.address)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold-primary text-sm uppercase tracking-widest font-semibold hover:text-gray-900 transition-colors relative z-10"
            >
              View on Map
            </a>
          </motion.div>

          {/* Card 2: Phone */}
          <motion.div variants={itemVariants} className="group relative bg-white border border-[#F0EAE1] p-8 flex flex-col items-center text-center overflow-hidden transition-all duration-500 hover:border-gold-primary rounded-2xl">
            <div className="absolute inset-0 bg-gold-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center mb-6 group-hover:border-gold-primary transition-colors bg-white">
              <Phone className="w-6 h-6 text-gold-accent" />
            </div>
            <p className="text-gray-900 font-serif text-xl mb-4">Phone</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow flex items-center justify-center">
              {details.phone}
            </p>
            <a 
              href={`tel:${details.phone.replace(/[^0-9+]/g, "")}`}
              className="text-gold-primary text-sm uppercase tracking-widest font-semibold hover:text-gray-900 transition-colors relative z-10"
            >
              Call Now
            </a>
          </motion.div>

          {/* Card 3: Instagram */}
          <motion.div variants={itemVariants} className="group relative bg-white border border-[#F0EAE1] p-8 flex flex-col items-center text-center overflow-hidden transition-all duration-500 hover:border-gold-primary rounded-2xl">
            <div className="absolute inset-0 bg-gold-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center mb-6 group-hover:border-gold-primary transition-colors bg-white">
              <Instagram className="w-6 h-6 text-gold-accent" />
            </div>
            <p className="text-gray-900 font-serif text-xl mb-4">Instagram</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow flex items-center justify-center">
              {details.instagram}
            </p>
            <a 
              href={`https://instagram.com/${details.instagram.replace("@", "")}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold-primary text-sm uppercase tracking-widest font-semibold hover:text-gray-900 transition-colors relative z-10"
            >
              Visit Instagram
            </a>
          </motion.div>

          {/* Card 4: Business Hours */}
          <motion.div variants={itemVariants} className="group relative bg-white border border-[#F0EAE1] p-8 flex flex-col items-center text-center overflow-hidden transition-all duration-500 hover:border-gold-primary rounded-2xl">
            <div className="absolute inset-0 bg-gold-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center mb-6 group-hover:border-gold-primary transition-colors bg-white">
              <Clock className="w-6 h-6 text-gold-accent" />
            </div>
            <p className="text-gray-900 font-serif text-xl mb-4">Business Hours</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow">
              <span className="block font-medium">Mon - Sat</span>
              <span className="block text-gray-500 mb-2">{details.hoursWeekdays}</span>
              <span className="block font-medium">Sunday</span>
              <span className="block text-gray-500">{details.hoursSunday}</span>
            </p>
            <span className="text-gold-primary text-sm uppercase tracking-widest font-semibold">
              Open Daily
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
