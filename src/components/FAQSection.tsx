import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { faqs as staticFaqs } from "../data";
import { motion, AnimatePresence } from "motion/react";

export function FAQSection() {
  const [loadedFaqs, setLoadedFaqs] = useState<any[]>(staticFaqs);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/faqs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLoadedFaqs(data);
        }
      })
      .catch((err) => console.log("Falling back to static FAQs:", err));
  }, []);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-10 bg-white border-t border-gray-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
           <h2 className="font-serif text-3xl md:text-5xl text-gray-900 mb-6">Frequently Asked Questions</h2>
           <div className="w-24 h-1 bg-gold-primary mx-auto"></div>
        </div>

        <div className="space-y-4">
          {loadedFaqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border transition-colors duration-300 ${openIndex === index ? 'border-gold-primary bg-white' : 'border-gray-200 bg-white hover:border-gray-600'}`}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between focus:outline-none"
                onClick={() => toggleOpen(index)}
              >
                <span className="font-serif text-lg md:text-xl text-gray-900 text-left pr-4">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-gold-accent transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-gray-600 font-light leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
