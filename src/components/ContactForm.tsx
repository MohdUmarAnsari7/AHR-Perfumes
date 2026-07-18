import React, { useState } from "react";
import { inquiryOptions } from "../data";
import { ChevronDown } from "lucide-react";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function ContactForm() {
  const { websiteSections } = useWebsiteContentStore();
  
  const formSection = websiteSections?.contact?.form_section || {
    title: "Send Us A Message",
    subtitle: "We will respond as soon as possible.",
    image: "https://images.unsplash.com/photo-1595532545115-4ba972e382bb?q=80&w=1500&auto=format&fit=crop"
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "",
    message: ""
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", phone: "", inquiryType: "", message: "" });
        
        // Reset success message after 5 seconds
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Failed to submit inquiry:", err);
      setStatus("error");
    }
  };

  return (
    <section className="py-10 bg-white border-t border-[#F0EAE1]">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-col lg:flex-row gap-0 border border-gray-200 overflow-hidden rounded-3xl shadow-xs">
          
          {/* Left Side: Image */}
          <div className="lg:w-1/2 relative h-[200px] sm:h-[280px] lg:h-auto min-h-0 lg:min-h-[500px]">
             <img 
               src={(formSection as any).image || "https://images.unsplash.com/photo-1595532545115-4ba972e382bb?q=80&w=1500&auto=format&fit=crop"} 
               alt="Luxury Perfume" 
               className="absolute inset-0 w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
             <div className="absolute inset-0 bg-gold-primary/10 mix-blend-overlay"></div>
          </div>

          {/* Right Side: Form */}
          <div className="lg:w-1/2 bg-white p-5 sm:p-8 md:p-14">
             <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-2 sm:mb-3">{formSection.title}</h3>
             <p className="text-gray-600 font-light tracking-wide text-xs sm:text-sm mb-6 sm:mb-10 w-full border-b border-gold-primary pb-3 sm:pb-4">
               {formSection.subtitle}
             </p>

             <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                   <label htmlFor="name" className="block text-[10px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1.5 sm:mb-2">Full Name *</label>
                   <input 
                     type="text" 
                     id="name" 
                     name="name"
                     required
                     value={formData.name}
                     onChange={handleChange}
                     className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-gold-primary transition-colors focus:ring-1 focus:ring-gold-primary rounded-lg" 
                   />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="email" className="block text-[10px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1.5 sm:mb-2">Email Address *</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-gold-primary transition-colors focus:ring-1 focus:ring-gold-primary rounded-lg" 
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-[10px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1.5 sm:mb-2">Phone Number *</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-gold-primary transition-colors focus:ring-1 focus:ring-gold-primary rounded-lg" 
                    />
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="inquiryType" className="block text-[10px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1.5 sm:mb-2">Inquiry Type *</label>
                  <select 
                    id="inquiryType"
                    name="inquiryType"
                    required
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-gold-primary transition-colors appearance-none focus:ring-1 focus:ring-gold-primary rounded-lg"
                  >
                    <option value="" disabled>Select an option</option>
                    {inquiryOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-[38px] sm:top-10 pointer-events-none text-gray-500">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>

                <div>
                   <label htmlFor="message" className="block text-[10px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1.5 sm:mb-2">Message *</label>
                   <textarea 
                     id="message" 
                     name="message"
                     rows={4}
                     required
                     value={formData.message}
                     onChange={handleChange}
                     className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-gold-primary transition-colors resize-none focus:ring-1 focus:ring-gold-primary rounded-lg"
                   ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={status === "loading"}
                  className="w-full bg-gold-primary text-black font-semibold uppercase tracking-widest text-xs sm:text-sm py-3.5 sm:py-4 hover:bg-gold-accent transition-colors disabled:opacity-70 flex justify-center items-center rounded-lg cursor-pointer"
                >
                  {status === "loading" ? "Sending..." : "Send Inquiry"}
                </button>

                {status === "success" && (
                  <div className="bg-green-900/40 border border-green-500/50 text-green-400 px-4 py-3 text-sm text-center rounded-lg">
                    Thank you! Your inquiry has been sent successfully.
                  </div>
                )}
                {status === "error" && (
                  <div className="bg-red-900/40 border border-red-500/50 text-red-400 px-4 py-3 text-sm text-center rounded-lg">
                    An error occurred. Please try again later.
                  </div>
                )}
             </form>
          </div>

        </div>
      </div>
    </section>
  );
}
