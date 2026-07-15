import React, { useState } from "react";
import { useWebsiteContentStore, WebsiteSectionData } from "../store/useWebsiteContent";
import { 
  Upload, Trash2, Plus, ChevronUp, ChevronDown, 
  Save, Image, Settings, Layers, Home, 
  ShoppingBag, Tag, Info, Grid, Mail, Sparkles, Check,
  MapPin, Phone, Instagram, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WebsiteSectionEditorProps {
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  forcePageTab?: keyof WebsiteSectionData;
}

export function WebsiteSectionEditor({ showToast, forcePageTab }: WebsiteSectionEditorProps) {
  const { websiteSections, updateWebsiteSections, loading } = useWebsiteContentStore();
  const [activePageTab, setActivePageTab] = useState<keyof WebsiteSectionData>("home");
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Sync local state if forcePageTab is provided
  React.useEffect(() => {
    if (forcePageTab) {
      setActivePageTab(forcePageTab);
    }
  }, [forcePageTab]);

  // Keep a local copy of sections for smooth editing before saving
  const [localSections, setLocalSections] = useState<WebsiteSectionData>(websiteSections);

  // Sync local state if store updates
  React.useEffect(() => {
    setLocalSections(websiteSections);
  }, [websiteSections]);

  const pageTabs = [
    { id: "home" as const, label: "Home Page", icon: Home, desc: "Manage main landing sections" },
    { id: "shop" as const, label: "Shop Page", icon: ShoppingBag, desc: "Configure product collection headers" },
    { id: "categories" as const, label: "Categories Page", icon: Tag, desc: "Configure fragrance categories headers" },
    { id: "about" as const, label: "About Page", icon: Info, desc: "Edit heritage, story, and core values" },
    { id: "gallery_page" as const, label: "Gallery Page", icon: Grid, desc: "Customize image gallery showcase headers" },
    { id: "contact" as const, label: "Contact Page", icon: Mail, desc: "Update details, showroom map, hours, and text" },
  ];

function SectionImageLibrary({ 
  section, 
  currentImage, 
  onSelect, 
  showToast 
}: { 
  section: string; 
  currentImage: string | undefined; 
  onSelect: (url: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [images, setImages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media-library?section=${section}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchImages();
  }, [section, currentImage]);

  const handleDelete = async (id: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this image from your section library?")) return;
    try {
      const res = await fetch(`/api/media-library/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Image removed from section library.", "success");
        fetchImages();
      } else {
        showToast("Failed to delete image.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-[10px] text-neutral-400 py-1.5 font-mono uppercase tracking-widest">
        <span className="w-2 h-2 rounded-full bg-gold-primary animate-pulse"></span>
        <span>Scanning section vault...</span>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 bg-[#FAF9F6] border border-[#F0EAE1] p-3 rounded-xl">
      <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase text-neutral-500 tracking-wider mb-2">
        <Image className="w-3.5 h-3.5 text-gold-accent" />
        <span>Your {section.toUpperCase()} Asset Library</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-24 overflow-y-auto pr-1">
        {images.map((img) => {
          const url = img.image_url || img.imageUrl;
          const isSelected = url === currentImage;
          return (
            <div 
              key={img.id}
              onClick={() => onSelect(url)}
              className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                isSelected ? "border-gold-primary ring-1 ring-gold-primary" : "border-neutral-200 hover:border-gold-primary"
              }`}
            >
              <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {isSelected && (
                <div className="absolute inset-0 bg-gold-primary/25 flex items-center justify-center">
                  <div className="bg-gold-primary text-neutral-900 rounded-full p-0.5">
                    <Check className="w-2.5 h-2.5 font-bold" />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => handleDelete(img.id, e)}
                className="absolute top-1 right-1 bg-red-600/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity"
                title="Delete from Library"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

  const handleUploadImageLocal = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: string,
    onComplete: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast("Uploading brand asset to storage...", "info");
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Content = reader.result as string;
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Content })
        });
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const resData = await response.json();
            onComplete(resData.url);
            showToast("Asset uploaded successfully!", "success");

            // Auto add to media library with component isolation
            fetch("/api/media-library", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: resData.url, section })
            }).catch(console.error);
          } else {
            console.error("Non-JSON upload response:", await response.text());
            showToast("Invalid response format received from server.", "error");
          }
        } else {
          showToast("Upload rejected by server.", "error");
        }
      } catch (err: any) {
        showToast("Upload service error: " + err.message, "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSection = async (page: keyof WebsiteSectionData, sectionKey: string) => {
    setSavingSection(sectionKey);
    try {
      const dataToSave = localSections || websiteSections;
      await updateWebsiteSections(dataToSave);
      showToast(`${sectionKey.toUpperCase().replace(/_/g, " ")} section saved successfully!`, "success");
    } catch (err: any) {
      showToast("Failed to save: " + err.message, "error");
    } finally {
      setSavingSection(null);
    }
  };

  const updateField = (
    page: keyof WebsiteSectionData,
    section: string,
    field: string,
    value: any
  ) => {
    setLocalSections(prev => {
      const current = prev || websiteSections || {};
      const pageData = current[page] || {};
      const sectionData = (pageData as any)[section] || {};
      return {
        ...current,
        [page]: {
          ...pageData,
          [section]: {
            ...sectionData,
            [field]: value
          }
        }
      };
    });
  };

  // --- RENDERING INDIVIDUAL PAGES ---

  const renderHomeEditor = () => {
    const home = localSections.home || websiteSections.home;

    return (
      <div className="space-y-8">
        {/* SECTION 1: HERO SLIDESHOW */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs relative">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Hero Slideshow Section</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Manage slides, background images, titles, and button links</p>
            </div>
            <div className="mt-2 sm:mt-0 flex space-x-2">
              <button 
                onClick={() => {
                  const newSlide = {
                    title: "Bespoke Premium Fragrance",
                    subtitle: "A.H.R Perfumes",
                    buttonText: "Shop Collection",
                    buttonLink: "/shop",
                    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500"
                  };
                  updateField("home", "hero", "slides", [...home.hero.slides, newSlide]);
                }}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slide</span>
              </button>
              <button 
                onClick={() => handleSaveSection("home", "hero")}
                disabled={savingSection === "hero"}
                className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSection === "hero" ? "Saving..." : "Save Section"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {home.hero.slides.map((slide, idx) => (
              <div key={idx} className="bg-[#FAF9F6] border border-[#F0EAE1] rounded-xl p-5 relative group">
                <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white border border-[#F0EAE1] rounded-lg p-1 shadow-xs">
                  <button 
                    disabled={idx === 0}
                    onClick={() => {
                      const slides = [...home.hero.slides];
                      const temp = slides[idx];
                      slides[idx] = slides[idx - 1];
                      slides[idx - 1] = temp;
                      updateField("home", "hero", "slides", slides);
                    }}
                    className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={idx === home.hero.slides.length - 1}
                    onClick={() => {
                      const slides = [...home.hero.slides];
                      const temp = slides[idx];
                      slides[idx] = slides[idx + 1];
                      slides[idx + 1] = temp;
                      updateField("home", "hero", "slides", slides);
                    }}
                    className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      const slides = home.hero.slides.filter((_, sIdx) => sIdx !== idx);
                      updateField("home", "hero", "slides", slides);
                    }}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Image Config (Desktop and Mobile side-by-side on sm+) */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b lg:border-b-0 lg:border-r border-[#F7F4EE] pb-4 lg:pb-0 lg:pr-6">
                    {/* Desktop Banner Image */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider flex items-center justify-between">
                        <span>Desktop Banner Image</span>
                        <span className="text-red-500 text-[9px] font-normal lowercase">(required)</span>
                      </label>
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-[#F0EAE1] bg-white hover:border-gold-primary transition-colors group/desk">
                        <img 
                          src={slide.image || undefined} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/desk:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-semibold uppercase tracking-wider space-x-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Desktop</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              handleUploadImageLocal(e, "hero", (url) => {
                                const slides = [...home.hero.slides];
                                slides[idx].image = url;
                                updateField("home", "hero", "slides", slides);
                              });
                            }}
                          />
                        </label>
                      </div>
                      <SectionImageLibrary 
                        section="hero" 
                        currentImage={slide.image} 
                        onSelect={(url) => {
                          const slides = [...home.hero.slides];
                          slides[idx].image = url;
                          updateField("home", "hero", "slides", slides);
                        }} 
                        showToast={showToast} 
                      />
                    </div>

                    {/* Mobile Banner Image */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider flex items-center justify-between">
                        <span>Mobile Banner Image</span>
                        <span className="text-neutral-400 text-[9px] font-normal lowercase">(optional - falls back to desktop)</span>
                      </label>
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-[#F0EAE1] bg-white hover:border-gold-primary transition-colors group/mobi">
                        <img 
                          src={slide.mobileImage || slide.image || undefined} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/mobi:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-semibold uppercase tracking-wider space-x-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Mobile</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              handleUploadImageLocal(e, "hero", (url) => {
                                const slides = [...home.hero.slides];
                                slides[idx].mobileImage = url;
                                updateField("home", "hero", "slides", slides);
                              });
                            }}
                          />
                        </label>
                      </div>
                      <SectionImageLibrary 
                        section="hero" 
                        currentImage={slide.mobileImage || slide.image} 
                        onSelect={(url) => {
                          const slides = [...home.hero.slides];
                          slides[idx].mobileImage = url;
                          updateField("home", "hero", "slides", slides);
                        }} 
                        showToast={showToast} 
                      />
                    </div>
                  </div>

                  {/* Right: Text Content */}
                  <div className="lg:col-span-1 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Heading</label>
                      <input 
                        type="text" 
                        value={slide.title}
                        onChange={(e) => {
                          const slides = [...home.hero.slides];
                          slides[idx].title = e.target.value;
                          updateField("home", "hero", "slides", slides);
                        }}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden focus:border-gold-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Description</label>
                      <input 
                        type="text" 
                        value={slide.subtitle}
                        onChange={(e) => {
                          const slides = [...home.hero.slides];
                          slides[idx].subtitle = e.target.value;
                          updateField("home", "hero", "slides", slides);
                        }}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden focus:border-gold-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Button Text</label>
                      <input 
                        type="text" 
                        value={slide.buttonText}
                        onChange={(e) => {
                          const slides = [...home.hero.slides];
                          slides[idx].buttonText = e.target.value;
                          updateField("home", "hero", "slides", slides);
                        }}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden focus:border-gold-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 1.5: FEATURE HIGHLIGHTS */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Feature Highlights Section</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Edit title, subtitle, and the 4 highlight boxes displayed under the Hero Banner</p>
            </div>
            <button 
              onClick={() => handleSaveSection("home", "highlights")}
              disabled={savingSection === "highlights"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "highlights" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-xs text-neutral-500">The title and subtitle for this section have been removed as requested. You can manage the items below:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {home.highlights?.items?.map((item: any, idx: number) => (
              <div key={idx} className="bg-[#FAF9F6] border border-[#F0EAE1] p-4 rounded-xl space-y-3">
                <div className="font-bold text-xs text-neutral-400 uppercase tracking-wider">Highlight Box {idx + 1}</div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Icon Name</label>
                  <input 
                    type="text" 
                    value={item.icon || ""}
                    onChange={(e) => {
                      const itemsCopy = [...home.highlights.items];
                      itemsCopy[idx].icon = e.target.value;
                      updateField("home", "highlights", "items", itemsCopy);
                    }}
                    placeholder="e.g. Calendar, ShieldCheck, Package, Truck"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden focus:border-gold-primary font-mono"
                  />
                  <p className="text-[9px] text-neutral-400 mt-0.5">Use Lucide icons: Calendar, ShieldCheck, Package, Truck, Droplet, Sparkles, Award, Heart, Globe, etc.</p>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Title</label>
                  <input 
                    type="text" 
                    value={item.title || ""}
                    onChange={(e) => {
                      const itemsCopy = [...home.highlights.items];
                      itemsCopy[idx].title = e.target.value;
                      updateField("home", "highlights", "items", itemsCopy);
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden focus:border-gold-primary"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Description</label>
                  <textarea 
                    rows={2}
                    value={item.description || ""}
                    onChange={(e) => {
                      const itemsCopy = [...home.highlights.items];
                      itemsCopy[idx].description = e.target.value;
                      updateField("home", "highlights", "items", itemsCopy);
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden focus:border-gold-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: FEATURED COLLECTION SECTION */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Featured Collections Tabs</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Independently manage headings, descriptions, and cover images for each chapter tab</p>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <button 
                type="button"
                onClick={() => {
                  const tabs = home.featured_collections?.tabs ? [...home.featured_collections.tabs] : [];
                  const newTab = {
                    tabName: "New Collection",
                    title: "Special Blend Collection",
                    description: "An exceptional combination of rare ingredients crafted for true connoisseurs.",
                    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2500&auto=format&fit=crop",
                    buttonText: "Explore Collection",
                    buttonLink: "/shop"
                  };
                  updateField("home", "featured_collections", "tabs", [...tabs, newTab]);
                }}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tab</span>
              </button>
              <button 
                onClick={() => handleSaveSection("home", "featured_collections")}
                disabled={savingSection === "featured_collections"}
                className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSection === "featured_collections" ? "Saving..." : "Save Section"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {(!home.featured_collections?.tabs || home.featured_collections.tabs.length === 0) ? (
              <div className="text-center py-8 border border-dashed border-[#F0EAE1] rounded-xl text-neutral-400 text-xs">
                No tabs added yet. Click "Add Tab" to create one.
              </div>
            ) : (
              home.featured_collections.tabs.map((tab, idx) => (
                <div key={idx} className="bg-[#FAF9F6] border border-[#F0EAE1] rounded-xl p-5 relative">
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <div className="bg-gold-primary/10 text-gold-accent font-bold tracking-widest text-[10px] px-2.5 py-1 rounded-full uppercase border border-gold-primary/20">
                      Tab {idx + 1}: {tab.tabName}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const tabsCopy = home.featured_collections.tabs.filter((_, sIdx) => sIdx !== idx);
                        updateField("home", "featured_collections", "tabs", tabsCopy);
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
                      title="Delete Tab"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Image */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block">Tab Banner Image</label>
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-[#F0EAE1] bg-white group hover:border-gold-primary transition-colors">
                        <img 
                          src={tab.image || undefined} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold uppercase tracking-wider space-x-1">
                          <Upload className="w-4 h-4" />
                          <span>Upload Banner</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              handleUploadImageLocal(e, "banner", (url) => {
                                const tabsCopy = [...home.featured_collections.tabs];
                                tabsCopy[idx].image = url;
                                updateField("home", "featured_collections", "tabs", tabsCopy);
                              });
                            }}
                          />
                        </label>
                      </div>
                      <SectionImageLibrary 
                        section="banner" 
                        currentImage={tab.image} 
                        onSelect={(url) => {
                          const tabsCopy = [...home.featured_collections.tabs];
                          tabsCopy[idx].image = url;
                          updateField("home", "featured_collections", "tabs", tabsCopy);
                        }} 
                        showToast={showToast} 
                      />
                    </div>

                    {/* Texts - only edit tab name */}
                    <div className="md:col-span-2 flex flex-col justify-center">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Tab / Category Name</label>
                        <input 
                          type="text" 
                          value={tab.tabName}
                          onChange={(e) => {
                            const tabsCopy = [...home.featured_collections.tabs];
                            tabsCopy[idx].tabName = e.target.value;
                            updateField("home", "featured_collections", "tabs", tabsCopy);
                          }}
                          className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden focus:border-gold-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 7: STATS IN NUMBERS */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Showroom Statistics</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Manage custom counting and trust milestones</p>
            </div>
            <button 
              onClick={() => handleSaveSection("home", "stats")}
              disabled={savingSection === "stats"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "stats" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Section Heading</label>
            <input 
              type="text" 
              value={home.stats?.title || ""}
              onChange={(e) => updateField("home", "stats", "title", e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden focus:border-gold-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {home.stats?.items?.map((stat, idx) => (
              <div key={idx} className="bg-[#FAF9F6] border border-[#F0EAE1] p-3 rounded-lg space-y-2">
                <div>
                  <label className="text-[9px] font-bold uppercase text-neutral-500 tracking-wider">Number (e.g. 13+)</label>
                  <input 
                    type="text" 
                    value={stat.value}
                    onChange={(e) => {
                      const statsCopy = [...home.stats.items];
                      statsCopy[idx].value = e.target.value;
                      updateField("home", "stats", "items", statsCopy);
                    }}
                    className="w-full text-xs px-2 py-1 rounded-md border border-[#F0EAE1] bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-neutral-500 tracking-wider">Description Label</label>
                  <input 
                    type="text" 
                    value={stat.label}
                    onChange={(e) => {
                      const statsCopy = [...home.stats.items];
                      statsCopy[idx].label = e.target.value;
                      updateField("home", "stats", "items", statsCopy);
                    }}
                    className="w-full text-xs px-2 py-1 rounded-md border border-[#F0EAE1] bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 8: CONTACT CTA SECTION */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Contact Banner CTA</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Manage the background overlay and contact redirect button</p>
            </div>
            <button 
              onClick={() => handleSaveSection("home", "contact_cta")}
              disabled={savingSection === "contact_cta"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "contact_cta" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Headline Text</label>
                <input 
                  type="text" 
                  value={home.contact_cta?.title || ""}
                  onChange={(e) => updateField("home", "contact_cta", "title", e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Paragraph Subheading</label>
                <textarea 
                  rows={2}
                  value={home.contact_cta?.subtitle || ""}
                  onChange={(e) => updateField("home", "contact_cta", "subtitle", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Button Text</label>
                  <input 
                    type="text" 
                    value={home.contact_cta?.buttonText || ""}
                    onChange={(e) => updateField("home", "contact_cta", "buttonText", e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Button Link</label>
                  <input 
                    type="text" 
                    value={home.contact_cta?.buttonLink || ""}
                    onChange={(e) => updateField("home", "contact_cta", "buttonLink", e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Background Image</label>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#F0EAE1] bg-white group hover:border-gold-primary transition-colors mb-2">
                <img 
                  src={home.contact_cta?.bgImage || undefined} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold uppercase tracking-wider space-x-1">
                  <Upload className="w-4 h-4" />
                  <span>Replace Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      handleUploadImageLocal(e, "banner", (url) => {
                        updateField("home", "contact_cta", "bgImage", url);
                      });
                    }}
                  />
                </label>
              </div>
              <SectionImageLibrary 
                section="banner" 
                currentImage={home.contact_cta?.bgImage} 
                onSelect={(url) => updateField("home", "contact_cta", "bgImage", url)} 
                showToast={showToast} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGenericHeaderEditor = (page: "shop" | "categories" | "gallery_page") => {
    const pageData = localSections[page] || (websiteSections as any)[page];

    return (
      <div className="space-y-8">
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Hero Banner Section</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Edit title, subtitle, and full-width background banner</p>
            </div>
            <button 
              onClick={() => handleSaveSection(page, "hero")}
              disabled={savingSection === "hero"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "hero" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Headline text</label>
                <input 
                  type="text" 
                  value={pageData.hero?.title || ""}
                  onChange={(e) => updateField(page, "hero", "title", e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Subtitle narrative</label>
                <textarea 
                  rows={3}
                  value={pageData.hero?.subtitle || ""}
                  onChange={(e) => updateField(page, "hero", "subtitle", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Background Banner Image</label>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#F0EAE1] bg-white group hover:border-gold-primary transition-colors mb-2">
                <img 
                  src={pageData.hero?.bgImage || undefined} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold uppercase tracking-wider space-x-1">
                  <Upload className="w-4 h-4" />
                  <span>Replace Banner</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      handleUploadImageLocal(e, "banner", (url) => {
                        updateField(page, "hero", "bgImage", url);
                      });
                    }}
                  />
                </label>
              </div>
              <SectionImageLibrary 
                section="banner" 
                currentImage={pageData.hero?.bgImage} 
                onSelect={(url) => updateField(page, "hero", "bgImage", url)} 
                showToast={showToast} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAboutEditor = () => {
    const about = localSections.about || websiteSections.about;

    return (
      <div className="space-y-8">
        {/* HERO SECTION */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">About Hero Banner</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Configure headline, narrative, and cover background image</p>
            </div>
            <button 
              onClick={() => handleSaveSection("about", "hero")}
              disabled={savingSection === "hero"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "hero" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Headline title</label>
                <input 
                  type="text" 
                  value={about.hero?.title || ""}
                  onChange={(e) => updateField("about", "hero", "title", e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Subtitle tagline</label>
                <textarea 
                  rows={2}
                  value={about.hero?.subtitle || ""}
                  onChange={(e) => updateField("about", "hero", "subtitle", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Cover Image</label>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#F0EAE1] bg-white group hover:border-gold-primary transition-colors mb-2">
                <img 
                  src={about.hero?.bgImage || undefined} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold uppercase tracking-wider space-x-1">
                  <Upload className="w-4 h-4" />
                  <span>Replace Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      handleUploadImageLocal(e, "banner", (url) => {
                        updateField("about", "hero", "bgImage", url);
                      });
                    }}
                  />
                </label>
              </div>
              <SectionImageLibrary 
                section="banner" 
                currentImage={about.hero?.bgImage} 
                onSelect={(url) => updateField("about", "hero", "bgImage", url)} 
                showToast={showToast} 
              />
            </div>
          </div>
        </div>

        {/* STORY CONTENT SECTION */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Our Story & Heritage</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Refine story details, paragraphs, process images, and founder quotes</p>
            </div>
            <button 
              onClick={() => handleSaveSection("about", "story")}
              disabled={savingSection === "story"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "story" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Section Header Title</label>
                <input 
                  type="text" 
                  value={about.story?.title || ""}
                  onChange={(e) => updateField("about", "story", "title", e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Story Topic Title</label>
                <input 
                  type="text" 
                  value={about.story?.storyTitle || ""}
                  onChange={(e) => updateField("about", "story", "storyTitle", e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Story Paragraph Content (markdown/newlines supported)</label>
                <textarea 
                  rows={6}
                  value={about.story?.storyText || ""}
                  onChange={(e) => updateField("about", "story", "storyText", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Founder Quote Text</label>
                  <input 
                    type="text" 
                    value={about.story?.quoteText || ""}
                    onChange={(e) => updateField("about", "story", "quoteText", e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Quote Attribution</label>
                  <input 
                    type="text" 
                    value={about.story?.quoteAuthor || ""}
                    onChange={(e) => updateField("about", "story", "quoteAuthor", e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1">Story Showcase Image</label>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#F0EAE1] bg-white group hover:border-gold-primary transition-colors mb-2">
                <img 
                  src={about.story?.storyImage || undefined} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold uppercase tracking-wider space-x-1">
                  <Upload className="w-4 h-4" />
                  <span>Replace Story Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      handleUploadImageLocal(e, "about", (url) => {
                        updateField("about", "story", "storyImage", url);
                      });
                    }}
                  />
                </label>
              </div>
              <SectionImageLibrary 
                section="about" 
                currentImage={about.story?.storyImage} 
                onSelect={(url) => updateField("about", "story", "storyImage", url)} 
                showToast={showToast} 
              />
            </div>
          </div>
        </div>

        {/* CORE VALUES SECTION */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Brand Core Pillars</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Manage values, definitions, and card icons</p>
            </div>
            <button 
              onClick={() => handleSaveSection("about", "values")}
              disabled={savingSection === "values"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "values" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Section Heading Title</label>
              <input 
                type="text" 
                value={about.values?.title || ""}
                onChange={(e) => updateField("about", "values", "title", e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Section Tagline</label>
              <input 
                type="text" 
                value={about.values?.subtitle || ""}
                onChange={(e) => updateField("about", "values", "subtitle", e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {about.values?.items?.map((valCard, idx) => (
              <div key={idx} className="bg-[#FAF9F6] border border-[#F0EAE1] p-4 rounded-xl space-y-3">
                <div className="font-bold text-xs text-neutral-400 uppercase tracking-wider">Value Pillar {idx + 1}</div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Pillar Title</label>
                  <input 
                    type="text" 
                    value={valCard.title}
                    onChange={(e) => {
                      const valuesCopy = [...about.values.items];
                      valuesCopy[idx].title = e.target.value;
                      updateField("about", "values", "items", valuesCopy);
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#F0EAE1] bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Description Description</label>
                  <textarea 
                    rows={2}
                    value={valCard.description}
                    onChange={(e) => {
                      const valuesCopy = [...about.values.items];
                      valuesCopy[idx].description = e.target.value;
                      updateField("about", "values", "items", valuesCopy);
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#F0EAE1] bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContactEditor = () => {
    const contact = localSections.contact || websiteSections.contact;

    const whyVisitUs = contact.why_visit_us || {
      title: "Why Visit Our Showroom",
      subtitle: "Experience luxury fragrances in a boutique tailored for connoisseurs",
      items: [
        { title: "Exclusive Blends", description: "Taste and smell private blends reserved exclusively for in-store walk-ins.", icon: "Sparkles" },
        { title: "Bespoke Consulting", description: "Receive free, highly personalized consultations to match your personality profile.", icon: "UserCheck" },
        { title: "Purity Testing", description: "Verify our premium wood chips and essential oils live at our testing counters.", icon: "ShieldAlert" },
        { title: "Indore's Best Prices", description: "Direct wholesale rates on high-grade attars and customized gifting packages.", icon: "TrendingDown" }
      ]
    };

    return (
      <div className="space-y-8">
        {/* HERO SECTION */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Contact Page Hero</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Edit title, subtitle, and full-width contact banner</p>
            </div>
            <button 
              onClick={() => handleSaveSection("contact", "hero")}
              disabled={savingSection === "hero"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "hero" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Hero Title</label>
                <input 
                  type="text" 
                  value={contact.hero?.title || ""}
                  onChange={(e) => updateField("contact", "hero", "title", e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Hero Subtitle</label>
                <textarea 
                  rows={2}
                  value={contact.hero?.subtitle || ""}
                  onChange={(e) => updateField("contact", "hero", "subtitle", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Banner Image</label>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#F0EAE1] bg-white group hover:border-gold-primary transition-colors mb-2">
                <img 
                  src={contact.hero?.bgImage || undefined} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold uppercase tracking-wider space-x-1">
                  <Upload className="w-4 h-4" />
                  <span>Replace Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      handleUploadImageLocal(e, "banner", (url) => {
                        updateField("contact", "hero", "bgImage", url);
                      });
                    }}
                  />
                </label>
              </div>
              <SectionImageLibrary 
                section="banner" 
                currentImage={contact.hero?.bgImage} 
                onSelect={(url) => updateField("contact", "hero", "bgImage", url)} 
                showToast={showToast} 
              />
            </div>
          </div>
        </div>

        {/* 4 EDITABLE CONTACT DETAILS BOXES (REDESIGNED GRID) */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Contact Info Boxes</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Manage the 4 focal contact points displayed on the website</p>
            </div>
            <button 
              onClick={() => handleSaveSection("contact", "details")}
              disabled={savingSection === "details"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "details" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Location */}
            <div className="border border-[#F0EAE1] rounded-xl p-5 bg-[#FAF9F6] space-y-3">
              <div className="flex items-center space-x-2 border-b border-[#F0EAE1] pb-2 mb-2">
                <MapPin className="w-4 h-4 text-gold-accent" />
                <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-800">Box 1: Location Settings</h4>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Physical Address</label>
                <textarea 
                  rows={2}
                  value={contact.details?.address || ""}
                  onChange={(e) => updateField("contact", "details", "address", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                  placeholder="Enter store address..."
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Interactive Map Location (Address or Embed Link)</label>
                <input 
                  type="text" 
                  value={contact.details?.mapLocation || ""}
                  onChange={(e) => updateField("contact", "details", "mapLocation", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                  placeholder="e.g. 147 Jawahar Marg, Indore OR Google Maps URL..."
                />
                <p className="text-[9px] text-neutral-400 mt-1">Provide address words or a full Google Maps iframe embed URL.</p>
              </div>
            </div>

            {/* Box 2: Phone */}
            <div className="border border-[#F0EAE1] rounded-xl p-5 bg-[#FAF9F6] space-y-3">
              <div className="flex items-center space-x-2 border-b border-[#F0EAE1] pb-2 mb-2">
                <Phone className="w-4 h-4 text-gold-accent" />
                <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-800">Box 2: Phone Settings</h4>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Phone / WhatsApp Number</label>
                <input 
                  type="text" 
                  value={contact.details?.phone || ""}
                  onChange={(e) => updateField("contact", "details", "phone", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                  placeholder="e.g. +91 99261 80003"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={contact.details?.email || ""}
                  onChange={(e) => updateField("contact", "details", "email", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                  placeholder="e.g. contact@ahrperfumes.com"
                />
              </div>
            </div>

            {/* Box 3: Instagram */}
            <div className="border border-[#F0EAE1] rounded-xl p-5 bg-[#FAF9F6] space-y-3">
              <div className="flex items-center space-x-2 border-b border-[#F0EAE1] pb-2 mb-2">
                <Instagram className="w-4 h-4 text-gold-accent" />
                <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-800">Box 3: Instagram Settings</h4>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Instagram Handle</label>
                <input 
                  type="text" 
                  value={contact.details?.instagram || ""}
                  onChange={(e) => updateField("contact", "details", "instagram", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                  placeholder="e.g. @a.h.r.perfumes_"
                />
              </div>
            </div>

            {/* Box 4: Business Hours */}
            <div className="border border-[#F0EAE1] rounded-xl p-5 bg-[#FAF9F6] space-y-3">
              <div className="flex items-center space-x-2 border-b border-[#F0EAE1] pb-2 mb-2">
                <Clock className="w-4 h-4 text-gold-accent" />
                <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-800">Box 4: Business Hours</h4>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Weekdays & Saturday Hours</label>
                <input 
                  type="text" 
                  value={contact.details?.hoursWeekdays || ""}
                  onChange={(e) => updateField("contact", "details", "hoursWeekdays", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                  placeholder="e.g. 10:00 AM – 10:00 PM"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Sunday Hours</label>
                <input 
                  type="text" 
                  value={contact.details?.hoursSunday || ""}
                  onChange={(e) => updateField("contact", "details", "hoursSunday", e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                  placeholder="e.g. Open All Day"
                />
              </div>
            </div>
          </div>
        </div>

        {/* WHY VISIT OUR SHOWROOM SECTION */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Why Visit Our Showroom</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Edit title, subtitle, and the 4 highlight reason cards</p>
            </div>
            <button 
              onClick={() => handleSaveSection("contact", "why_visit_us")}
              disabled={savingSection === "why_visit_us"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "why_visit_us" ? "Saving..." : "Save Section"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Section Title</label>
                <input 
                  type="text" 
                  value={whyVisitUs.title}
                  onChange={(e) => updateField("contact", "why_visit_us", "title", e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Section Subtitle</label>
                <input 
                  type="text" 
                  value={whyVisitUs.subtitle}
                  onChange={(e) => updateField("contact", "why_visit_us", "subtitle", e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyVisitUs.items.map((item: any, idx: number) => (
                <div key={idx} className="border border-[#F0EAE1] rounded-xl p-4 bg-[#FAF9F6] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-2">
                    <span className="text-[10px] font-bold uppercase text-neutral-400">Card {idx + 1}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] text-neutral-400">Icon:</span>
                      <select 
                        value={item.icon}
                        onChange={(e) => {
                          const itemsCopy = [...whyVisitUs.items];
                          itemsCopy[idx].icon = e.target.value;
                          updateField("contact", "why_visit_us", "items", itemsCopy);
                        }}
                        className="text-[10px] bg-white border border-[#F0EAE1] rounded px-1.5 py-0.5"
                      >
                        <option value="Sparkles">Sparkles</option>
                        <option value="UserCheck">UserCheck</option>
                        <option value="ShieldAlert">ShieldAlert</option>
                        <option value="TrendingDown">TrendingDown</option>
                        <option value="Award">Award</option>
                        <option value="MapPin">MapPin</option>
                        <option value="Gem">Gem</option>
                        <option value="Heart">Heart</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Card Title</label>
                    <input 
                      type="text" 
                      value={item.title}
                      onChange={(e) => {
                        const itemsCopy = [...whyVisitUs.items];
                        itemsCopy[idx].title = e.target.value;
                        updateField("contact", "why_visit_us", "items", itemsCopy);
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-neutral-500 block mb-1">Card Description</label>
                    <textarea 
                      rows={2}
                      value={item.description}
                      onChange={(e) => {
                        const itemsCopy = [...whyVisitUs.items];
                        itemsCopy[idx].description = e.target.value;
                        updateField("contact", "why_visit_us", "items", itemsCopy);
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#F0EAE1] bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INQUIRY FORM BANNER IMAGE (ONLY IMAGE AS REQUESTED) */}
        <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#F7F4EE] pb-4 mb-6">
            <div>
              <h3 className="text-md font-serif uppercase tracking-widest text-gold-accent font-bold">Inquiry Form Side Image</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Customize the high-end showcase image featured on the inquiry form section</p>
            </div>
            <button 
              onClick={() => handleSaveSection("contact", "form_section")}
              disabled={savingSection === "form_section"}
              className="bg-gold-primary hover:bg-gold-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center space-x-1 uppercase cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === "form_section" ? "Saving..." : "Save Image"}</span>
            </button>
          </div>

          <div className="max-w-md mx-auto">
            <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-2">Showcase Image Preview</label>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-[#F0EAE1] bg-white group hover:border-gold-primary transition-colors">
              <img 
                src={contact.form_section?.image || "https://images.unsplash.com/photo-1595532545115-4ba972e382bb?q=80&w=1500&auto=format&fit=crop"} 
                alt="Inquiry Banner" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold uppercase tracking-wider space-x-1">
                <Upload className="w-4 h-4" />
                <span>Replace Inquiry Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    handleUploadImageLocal(e, "banner", (url) => {
                      updateField("contact", "form_section", "image", url);
                    });
                  }}
                />
              </label>
            </div>
            <SectionImageLibrary 
              section="banner" 
              currentImage={contact.form_section?.image} 
              onSelect={(url) => updateField("contact", "form_section", "image", url)} 
              showToast={showToast} 
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Horizontal Tabs for Page Selection */}
      {!forcePageTab && (
        <div className="bg-[#FAF9F6] border border-[#F0EAE1] p-2 rounded-2xl flex flex-wrap gap-2">
          {pageTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activePageTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActivePageTab(tab.id)}
                className={`flex-1 min-w-[140px] px-4 py-3.5 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${
                  isSelected 
                    ? "bg-white border-gold-primary text-gold-accent shadow-xs" 
                    : "bg-transparent border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <TabIcon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-gold-accent" : "text-neutral-400"}`} />
                <span className="text-xs uppercase tracking-wider font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Editor stage with animation */}
      <div className="space-y-6">
        {!forcePageTab && (
          <div className="border-b border-[#F7F4EE] pb-3">
            <h2 className="text-lg font-serif uppercase tracking-widest text-[#111111] font-bold flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gold-accent" />
              <span>Section Content: {pageTabs.find(t => t.id === activePageTab)?.label}</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
              {pageTabs.find(t => t.id === activePageTab)?.desc}
            </p>
          </div>
        )}

        {activePageTab === "home" && renderHomeEditor()}
        {activePageTab === "shop" && renderGenericHeaderEditor("shop")}
        {activePageTab === "categories" && renderGenericHeaderEditor("categories")}
        {activePageTab === "about" && renderAboutEditor()}
        {activePageTab === "gallery_page" && renderGenericHeaderEditor("gallery_page")}
        {activePageTab === "contact" && renderContactEditor()}
      </div>
    </div>
  );
}
