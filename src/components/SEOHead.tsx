import { Helmet } from "react-helmet-async";
import { useBusinessInfoStore } from "../store/useBusinessInfo";

export function SEOHead() {
  const info = useBusinessInfoStore((state) => state.info);

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": info.name,
    "image": "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop",
    "telephone": info.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "147 Jawahar Marg, Bombay Bazar, Near Minara Masjid",
      "addressLocality": "Indore",
      "addressRegion": "MP",
      "postalCode": "452002",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 22.7196,
      "longitude": 75.8577
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "11:00",
      "closes": "21:00"
    }
  };

  return (
    <Helmet>
      <title>{info.name} | Premium Attars & Luxury Fragrances</title>
      <meta name="description" content="Discover premium attars, luxury perfumes, and bakhoor at A.H.R Perfumes. Trusted fragrance retailer in Indore since 2007 offering wholesale and retail shipping across India." />
      
      {/* Open Graph / Social */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={`${info.name} | Premium Attars & Luxury Fragrances`} />
      <meta property="og:description" content="Discover premium attars, luxury perfumes, and bakhoor at A.H.R Perfumes. Trusted fragrance retailer in Indore since 2007." />
      <meta property="og:image" content="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200&auto=format&fit=crop" />
      <meta property="og:url" content="https://ahrperfumes.com" />
      <meta property="og:site_name" content={info.name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${info.name} | Premium Attars & Luxury Fragrances`} />
      <meta name="twitter:description" content="Discover premium attars, luxury perfumes, and bakhoor at A.H.R Perfumes." />
      <meta name="twitter:image" content="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200&auto=format&fit=crop" />

      {/* Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify(schemaMarkup)}
      </script>
    </Helmet>
  );
}
