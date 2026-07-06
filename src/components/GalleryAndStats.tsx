import { useState, useEffect } from "react";
import { Instagram, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { useWebsiteContentStore } from "../store/useWebsiteContent";

export function Gallery() {
  const [loadedImages, setLoadedImages] = useState<any[] | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { websiteSections } = useWebsiteContentStore();

  const title = websiteSections?.home?.gallery?.title || "Follow Our Journey";
  const subtitle = websiteSections?.home?.gallery?.subtitle || "@A.H.R.PERFUMES_";

  useEffect(() => {
    fetch("/api/gallery-images")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLoadedImages(data);
        } else {
          setLoadedImages([]);
        }
        setHasFetched(true);
      })
      .catch((err) => {
        console.log("Failed to load gallery images:", err);
        setLoadedImages([]);
        setHasFetched(true);
      });
  }, []);

  const galleryItems = loadedImages || [];

  return (
    <section className="py-12 bg-[#FAF9F6]">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center mb-8">
         <div className="flex items-center justify-center space-x-3 mb-4">
            <Instagram className="w-6 h-6 text-gold-primary" />
            <span className="text-gold-accent tracking-widest uppercase text-sm font-semibold">{subtitle}</span>
         </div>
         <h2 className="font-serif text-3xl md:text-5xl text-gray-900 mb-2">{title}</h2>
         <div className="w-24 h-1 bg-gold-primary mx-auto mt-4"></div>
      </div>

      {hasFetched && galleryItems.length === 0 ? (
        <div className="max-w-xl mx-auto px-6 py-12 text-center bg-white border border-[#F0EAE1] shadow-xs">
          <Camera className="w-10 h-10 text-neutral-300 mx-auto mb-3 stroke-[1.5]" />
          <p className="text-gray-500 text-sm">
            Our visual gallery is currently being curated. No images have been added yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {galleryItems.slice(0, 8).map((item, idx) => {
            const imgUrl = item.image_url || item.imageUrl;
            const instaUrl = item.instagram_url || item.instagramUrl || "https://www.instagram.com/a.h.r.perfumes_/";
            return (
              <a 
                key={item.id || idx} 
                href={instaUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative aspect-square group overflow-hidden bg-white block cursor-pointer border border-gray-100"
              >
                <img 
                   src={imgUrl} 
                   alt="Gallery item" 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                   referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                   <Instagram className="w-8 h-8 text-gray-900" />
                </div>
              </a>
            );
          })}
        </div>
      )}
      
      <div className="text-center mt-12">
        <Link 
          to="/gallery"
          className="inline-block border border-gray-200 py-3 px-8 text-xs font-semibold uppercase tracking-widest hover:border-gold-primary hover:text-gold-accent transition-colors"
        >
          View Full Gallery
        </Link>
      </div>
    </section>
  );
}

export function Stats() {
  const { websiteSections } = useWebsiteContentStore();

  const title = websiteSections?.home?.stats?.title || "Our Journey In Numbers";
  const statsList = websiteSections?.home?.stats?.items || [
    { value: "13+", label: "Years Experience" },
    { value: "5000+", label: "Happy Customers" },
    { value: "500+", label: "Products" },
    { value: "4.9★", label: "Customer Rating" }
  ];

  return (
    <section className="py-10 bg-white border-y border-[#F0EAE1]">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {title && (
          <div className="text-center mb-6">
            <h3 className="font-serif text-xl text-neutral-800 uppercase tracking-widest font-semibold">{title}</h3>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          {statsList.map((stat, idx) => (
            <div key={idx}>
              <div className="font-serif text-4xl md:text-5xl text-gold-accent mb-2">{stat.value}</div>
              <div className="text-xs tracking-widest text-gray-600 uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
