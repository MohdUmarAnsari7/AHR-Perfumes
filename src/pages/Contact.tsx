import { Helmet } from "react-helmet-async";
import { ContactHero } from "../components/ContactHero";
import { ContactInfo } from "../components/ContactInfo";
import { ContactForm } from "../components/ContactForm";
import { MapSection } from "../components/MapSection";
import { WhyVisitUs } from "../components/WhyVisitUs";
import { FAQSection } from "../components/FAQSection";
import { ContactCTA } from "../components/ContactCTA";
import { useBusinessInfoStore } from "../store/useBusinessInfo";

export default function Contact() {
  const info = useBusinessInfoStore((state) => state.info);

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": `Contact ${info.name}`,
    "description": "Get in touch with A.H.R Perfumes for premium attars, luxury perfumes, wholesale fragrance solutions, and expert recommendations in Indore.",
    "url": "https://ahrperfumes.com/contact",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": info.name,
      "telephone": info.phone,
      "email": info.email,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "147 Jawahar Marg, Near Minara Masjid, Bombay Bazar",
        "addressLocality": "Indore",
        "addressRegion": "MP",
        "postalCode": "452002",
        "addressCountry": "IN"
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact {info.name} | Premium Attars & Fragrances in Indore</title>
        <meta name="description" content="Get in touch with A.H.R Perfumes for premium attars, luxury perfumes, wholesale fragrance solutions, and expert recommendations in Indore." />
        
        {/* Open Graph / Social */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Contact ${info.name} | Premium Attars & Fragrances`} />
        <meta property="og:description" content="Get in touch with A.H.R Perfumes for premium attars, luxury perfumes, wholesale fragrance solutions, and expert recommendations in Indore." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1620021665476-805fd843e987?q=80&w=1200&auto=format&fit=crop" />
        <meta property="og:url" content="https://ahrperfumes.com/contact" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Contact ${info.name} | Premium Attars & Fragrances`} />
        <meta name="twitter:description" content="Get in touch with A.H.R Perfumes for premium attars, luxury perfumes, wholesale fragrance solutions, and expert recommendations in Indore." />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1620021665476-805fd843e987?q=80&w=1200&auto=format&fit=crop" />

        {/* Schema Markup */}
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>

      <ContactHero />
      <ContactInfo />
      <WhyVisitUs />
      <ContactForm />
      <MapSection />
      <FAQSection />
      <ContactCTA />
    </>
  );
}
