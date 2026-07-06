import { useState, useEffect } from "react";
import { categories as staticCategories } from "../data";
import { Link } from "react-router-dom";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function Categories() {
  const [loadedCategories, setLoadedCategories] = useState<any[]>(staticCategories);
  const { websiteSections } = useWebsiteContentStore();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLoadedCategories(data);
        }
      })
      .catch((err) => console.log("Falling back to static categories:", err));
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center mb-8">
         <h2 className="font-serif text-3xl md:text-5xl text-gray-900 mb-2">
           {websiteSections?.home?.categories_section?.title || "Categories"}
         </h2>
         <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4">
           {websiteSections?.home?.categories_section?.subtitle || "Discover your scent profile among our curated categories"}
         </p>
          <div className="w-24 h-1 bg-gold-primary mx-auto"></div>
      </div>
      
      {loadedCategories.length === 0 ? (
        <div className="text-center py-16 px-6 bg-[#FAF9F6] border border-dashed border-[#E5DFD5] max-w-lg mx-auto rounded-2xl">
          <p className="font-serif text-xl text-gray-800 uppercase tracking-widest mb-2">Collections Coming Soon</p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">Our master perfumers are curating bespoke fragrance collections. Please check back shortly as we prepare our premium inventory!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {loadedCategories.map((category) => (
            <Link 
              key={category.title} 
              to={`/shop?category=${encodeURIComponent(category.title)}`}
              className="relative aspect-[16/9] group overflow-hidden cursor-pointer"
            >
              <img 
                 src={category.image} 
                 alt={category.title} 
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-70 group-hover:opacity-100"
                 referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              
              <div className="absolute inset-0 p-10 flex flex-col justify-end">
                 <h3 className="font-serif text-3xl md:text-4xl text-white mb-3">{category.title}</h3>
                 <p className="text-gray-200 font-light max-w-sm mb-6">{category.description}</p>
                 <div className="overflow-hidden">
                   <span className="inline-block border-b border-gold-primary text-gold-accent pb-1 text-sm tracking-widest uppercase transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                     Explore Collection
                   </span>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
