import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { Link } from "react-router-dom";
import { Instagram, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  const info = useBusinessInfoStore((state) => state.info);

  return (
    <footer className="bg-[#FAF9F6] border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/">
              <h2 className="font-serif text-3xl tracking-widest text-gold-accent">
                {info.name}
              </h2>
            </Link>
            <p className="text-sm text-gray-600 max-w-xs leaing-relaxed">
              {info.tagline}. Purveyors of fine attars and luxury fragrances since {info.established}.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gold-accent hover:border-gold-primary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-serif text-lg text-gray-900 mb-6 tracking-wider">Shop</h3>
            <ul className="space-y-4">
              {["Attars", "Perfumes", "Bakhoor", "Gift Sets", "New Arrivals"].map((item) => (
                <li key={item}>
                  <Link 
                    to={item === "New Arrivals" ? "/shop" : `/shop?category=${encodeURIComponent(item)}`} 
                    className="text-sm text-gray-600 hover:text-gold-accent transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-serif text-lg text-gray-900 mb-6 tracking-wider">Help</h3>
            <ul className="space-y-4">
              {["Contact Us", "Shipping & Delivery", "Returns", "Terms of Service", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <Link 
                    to={item === "Contact Us" ? "/contact" : "#"} 
                    className="text-sm text-gray-600 hover:text-gold-accent transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-lg text-gray-900 mb-6 tracking-wider">Contact</h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-gold-primary mr-3 flex-shrink-0 mt-0.5" />
                <span>{info.address}</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-gold-primary mr-3 flex-shrink-0" />
                <span>{info.phone}</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-gold-primary mr-3 flex-shrink-0" />
                <span>{info.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} {info.name}. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span>Prices are inclusive of all taxes</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
