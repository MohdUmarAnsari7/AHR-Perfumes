import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  Server, 
  Terminal, 
  Copy, 
  RefreshCw, 
  Play, 
  Info, 
  ExternalLink, 
  FileCheck,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  Image as ImageIcon,
  ShoppingBag,
  FolderTree,
  FileText,
  FileDown,
  Compass,
  MapPin,
  Settings,
  Eye,
  EyeOff,
  LogOut,
  Upload,
  Link as LinkIcon,
  Check,
  AlertCircle,
  HelpCircle,
  Clock,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Home,
  ChevronUp,
  ChevronDown,
  Pencil,
  Instagram,
  Video
} from "lucide-react";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { WebsiteSectionEditor } from "../components/WebsiteSectionEditor";

// Mock activities list for Dashboard Overview
const INITIAL_ACTIVITIES = [
  { id: 1, text: "Product 'Oud Royal Attar' visibility enabled", time: "10 mins ago", type: "success" },
  { id: 2, text: "Hero heading updated to 'Premium Attars Crafted With Tradition'", time: "45 mins ago", type: "info" },
  { id: 3, text: "Uploaded 2 new company images to About section", time: "2 hours ago", type: "image" },
  { id: 4, text: "Database connection validated", time: "4 hours ago", type: "system" }
];

export default function SupabaseConsole() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("ahr_owner_logged_in") === "true";
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Layout Tab selection
  const [activeTab, setActiveTab] = useState<"home" | "shop" | "categories" | "about" | "gallery" | "contact">("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Shared status states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Global Content stores
  const businessStore = useBusinessInfoStore();
  const websiteStore = useWebsiteContentStore();

  // Dashboard Overview state
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [dbStatusLoading, setDbStatusLoading] = useState(true);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Gallery Visual Story Form states
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newGalleryInstagramUrl, setNewGalleryInstagramUrl] = useState("https://www.instagram.com/a.h.r.perfumes_/");
  const [editingGalleryId, setEditingGalleryId] = useState<any>(null);
  const [editGalleryForm, setEditGalleryForm] = useState({ image_url: "", instagram_url: "", sort_order: 0 });
  const visualStoryInputRef = useRef<HTMLInputElement>(null);
  const editVisualStoryInputRef = useRef<HTMLInputElement>(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  // --- PRODUCT FORM STATES ---
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<any>(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    category: "Attars",
    description: "",
    price: "",
    originalPrice: "",
    image: "",
    images: [] as string[],
    isBestSeller: false,
    isVisible: true,
    stock: "100",
    specifications: {
      concentration: "Pure Perfume Oil (Attar)",
      longevity: "12+ Hours",
      projection: "Strong",
      sillage: "Excellent",
      ingredients: "Natural Essential Oils, Oud, Musk",
      bottleType: "Octagonal Glass bottle with roll-on & glass applicator",
      packaging: "Premium wooden presentation casket with velvet lining"
    },
    features: [] as string[],
    brochureUrl: "",
    seoTitle: "",
    seoDescription: "",
    sizes: [] as { size: string; price: string; originalPrice?: string }[]
  });
  const [tempFeature, setTempFeature] = useState("");
  const [tempSpecKey, setTempSpecKey] = useState("");
  const [tempSpecVal, setTempSpecVal] = useState("");

  // Product Filters/Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [sortField, setSortField] = useState("name-asc");

  // --- CATEGORY FORM STATES ---
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<any>(null);
  const [catForm, setCatForm] = useState({
    title: "",
    description: "",
    image: ""
  });

  // --- WEBPAGE CONTENT FORM STATE (HOMEPAGE CODES) ---
  const [homeForm, setHomeForm] = useState({
    heroHeading: "",
    heroSubheading: "",
    heroButtonText: "",
    heroImages: [] as string[],
    aboutSection: "",
    missionVision: "",
    contactInfo: {
      address: "",
      phone: "",
      email: "",
      instagram: ""
    },
    footerContent: {
      description: "",
      copyright: ""
    }
  });

  // --- ADVANCED DEV TOOLS CODES ---
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM products LIMIT 5;");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Fetch status of DB & all items
  const loadDbStatus = async () => {
    setDbStatusLoading(true);
    try {
      const res = await fetch("/api/db/status");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDbStatusLoading(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch("/api/media-library");
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const loadGallery = async () => {
    setLoadingGallery(true);
    try {
      const res = await fetch("/api/gallery-images");
      if (res.ok) {
        const data = await res.json();
        setGalleryList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadDbStatus();
      loadProducts();
      loadCategories();
      loadMedia();
      loadGallery();
      websiteStore.fetchContent();
    }
  }, [isLoggedIn]);

  // Synchronize dynamic homepage text configuration form
  useEffect(() => {
    if (websiteStore.homepage) {
      setHomeForm({
        heroHeading: websiteStore.homepage.heroHeading || "",
        heroSubheading: websiteStore.homepage.heroSubheading || "",
        heroButtonText: websiteStore.homepage.heroButtonText || "",
        heroImages: websiteStore.homepage.heroImages || [],
        aboutSection: websiteStore.homepage.aboutSection || "",
        missionVision: websiteStore.homepage.missionVision || "",
        contactInfo: {
          address: websiteStore.homepage.contactInfo?.address || "",
          phone: websiteStore.homepage.contactInfo?.phone || "",
          email: websiteStore.homepage.contactInfo?.email || "",
          instagram: websiteStore.homepage.contactInfo?.instagram || ""
        },
        footerContent: {
          description: websiteStore.homepage.footerContent?.description || "",
          copyright: websiteStore.homepage.footerContent?.copyright || ""
        }
      });
    }
  }, [websiteStore.homepage]);

  // Toast notifier trigger helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    setTimeout(() => {
      // Allow general demo access, but explicitly match owner credentials
      // Or simply allow pass of any password >= 6 length for high playability
      if (loginEmail === "owner@ahrperfumes.com" && loginPassword === "admin123") {
        localStorage.setItem("ahr_owner_logged_in", "true");
        setIsLoggedIn(true);
        showToast("Welcome back, Master Perfumer!", "success");
      } else if (loginPassword === "admin123" || loginPassword === "owner123") {
        localStorage.setItem("ahr_owner_logged_in", "true");
        setIsLoggedIn(true);
        showToast("Authenticated using bypass credentials.", "success");
      } else {
        setLoginError("Invalid administrator credentials. Try owner@ahrperfumes.com / admin123");
      }
      setLoginLoading(false);
    }, 800);
  };

  // Bypass option
  const handleBypass = () => {
    localStorage.setItem("ahr_owner_logged_in", "true");
    setIsLoggedIn(true);
    showToast("Master session started via quick bypass.", "success");
  };

  // Sign out handler
  const handleLogout = () => {
    localStorage.removeItem("ahr_owner_logged_in");
    setIsLoggedIn(false);
    showToast("Safely logged out of owner session.", "info" as any);
  };

  // Track system activity
  const addActivity = (text: string, type: string = "info") => {
    const newAct = {
      id: Date.now(),
      text,
      time: "Just now",
      type
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 5)]);
  };

  // --- IMAGE FILE UPLOAD TO URL CONVERTER ---
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, onComplete: (url: string) => void, section: string = "gallery") => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast("Processing premium asset upload...");
    
    // Read as Base64 data url
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
            showToast("Image uploaded successfully!", "success");
            
            // Also automatically add uploaded asset to Media Library gallery lists
            await fetch("/api/media-library", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: resData.url, section })
            });
            loadMedia();
          } else {
            console.error("Non-JSON upload response:", await response.text());
            showToast("Invalid response format received from server.", "error");
          }
        } else {
          showToast("Server rejected asset upload.", "error");
        }
      } catch (err: any) {
        showToast("Asset service error: " + err.message, "error");
      }
    };
    reader.readAsDataURL(file);
  };

  // --- VISUAL STORY (GALLERY) CRUD HANDLERS ---
  const handleAddGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryInstagramUrl) {
      showToast("Please enter an Instagram Reel URL first.", "error");
      return;
    }

    try {
      const res = await fetch("/api/gallery-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: newGalleryUrl || newGalleryInstagramUrl,
          instagram_url: newGalleryInstagramUrl,
          sort_order: galleryList.length
        })
      });
      if (res.ok) {
        showToast("Gallery Reel registered successfully!", "success");
        setNewGalleryUrl("");
        setNewGalleryInstagramUrl("https://www.instagram.com/a.h.r.perfumes_/");
        loadGallery();
        addActivity("Registered new Visual Story gallery item", "success");
      } else {
        showToast("Failed to register gallery item", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleStartEditGallery = (item: any) => {
    setEditingGalleryId(item.id);
    setEditGalleryForm({
      image_url: item.instagram_url || item.instagramUrl || item.image_url || item.imageUrl || "https://www.instagram.com/a.h.r.perfumes_/",
      instagram_url: item.instagram_url || item.instagramUrl || item.image_url || item.imageUrl || "https://www.instagram.com/a.h.r.perfumes_/",
      sort_order: item.sort_order || 0
    });
  };

  const handleSaveEditGallery = async (id: any) => {
    try {
      const res = await fetch(`/api/gallery-images/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editGalleryForm)
      });
      if (res.ok) {
        showToast("Instagram Reel link updated successfully!", "success");
        setEditingGalleryId(null);
        loadGallery();
        addActivity("Updated Instagram Reel link", "success");
      } else {
        showToast("Failed to update Reel link", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteGalleryImage = async (id: any) => {
    triggerConfirm("Are you sure you want to delete this Reel link from Our Visual Story?", async () => {
      try {
        const res = await fetch(`/api/gallery-images/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          showToast("Reel link deleted successfully!", "success");
          loadGallery();
          addActivity("Deleted Instagram Reel link", "success");
        } else {
          showToast("Failed to delete Reel link", "error");
        }
      } catch (err: any) {
        showToast(err.message, "error");
      }
    });
  };

  const handleMoveGalleryItem = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryList.length) return;

    const currentItem = galleryList[index];
    const targetItem = galleryList[targetIndex];

    try {
      // Swapping sort order
      const currentOrder = currentItem.sort_order || 0;
      const targetOrder = targetItem.sort_order || 0;

      // Update current item sort_order to targetOrder
      await fetch(`/api/gallery-images/${currentItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: targetOrder })
      });

      // Update target item sort_order to currentOrder
      await fetch(`/api/gallery-images/${targetItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: currentOrder })
      });

      showToast("Order updated successfully!", "success");
      loadGallery();
    } catch (err: any) {
      showToast("Failed to reorder: " + err.message, "error");
    }
  };

  // --- WEB PAGES SECTION IMAGE HANDLERS ---
  const handleSectionImageReplace = async (page: string, section: string, index: number | null, newUrl: string) => {
    const imagesCopy = JSON.parse(JSON.stringify(websiteStore.pageImages));
    
    if (index !== null) {
      if (Array.isArray(imagesCopy[page][section])) {
        imagesCopy[page][section][index] = newUrl;
      }
    } else {
      imagesCopy[page][section] = newUrl;
    }

    try {
      await websiteStore.updatePageImages(imagesCopy);
      showToast(`Successfully replaced image in ${page} > ${section}`, "success");
      addActivity(`Replaced image in ${page} page (${section} section)`, "image");
    } catch (err: any) {
      showToast(err.message || "Failed to replace image.", "error");
    }
  };

  const handleSectionImageAdd = async (page: string, section: string, newUrl: string) => {
    const imagesCopy = JSON.parse(JSON.stringify(websiteStore.pageImages));
    if (!Array.isArray(imagesCopy[page][section])) {
      imagesCopy[page][section] = [];
    }
    imagesCopy[page][section].push(newUrl);

    try {
      await websiteStore.updatePageImages(imagesCopy);
      showToast(`Added new image to ${page} > ${section}`, "success");
      addActivity(`Added brand image to ${page} page (${section} section)`, "image");
    } catch (err: any) {
      showToast(err.message || "Failed to add image.", "error");
    }
  };

  const handleSectionImageDelete = async (page: string, section: string, index: number) => {
    triggerConfirm("Delete this section image? This removes it instantly from the page layout.", async () => {
      const imagesCopy = JSON.parse(JSON.stringify(websiteStore.pageImages));
      if (Array.isArray(imagesCopy[page][section])) {
        imagesCopy[page][section].splice(index, 1);
      } else {
        imagesCopy[page][section] = ""; // Clear string
      }

      try {
        await websiteStore.updatePageImages(imagesCopy);
        showToast(`Removed image from ${page} > ${section}`, "success");
        addActivity(`Deleted image asset from ${page} page`, "success");
      } catch (err: any) {
        showToast(err.message || "Failed to remove image.", "error");
      }
    });
  };

  // --- PRODUCT ACTION HANDLERS ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.price) {
      showToast("Fragrance name and price are mandatory.", "error");
      return;
    }

    const payload = {
      name: prodForm.name,
      category: prodForm.category,
      description: prodForm.description,
      price: parseFloat(prodForm.price),
      originalPrice: prodForm.originalPrice ? parseFloat(prodForm.originalPrice) : null,
      image: prodForm.image,
      images: prodForm.images,
      isBestSeller: prodForm.isBestSeller,
      isVisible: prodForm.isVisible,
      stock: parseInt(prodForm.stock, 10) || 100,
      specifications: prodForm.specifications,
      features: prodForm.features,
      brochureUrl: prodForm.brochureUrl,
      seoTitle: prodForm.seoTitle,
      seoDescription: prodForm.seoDescription,
      sizes: prodForm.sizes ? prodForm.sizes.filter(s => s.size && s.price).map(s => ({
        size: s.size,
        price: parseFloat(s.price),
        originalPrice: s.originalPrice ? parseFloat(s.originalPrice) : null
      })) : []
    };

    try {
      let res;
      if (isEditingProduct && currentProductId) {
        res = await fetch(`/api/products/${currentProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast(isEditingProduct ? "Fragrance profile refined!" : "New premium fragrance launched!", "success");
        addActivity(isEditingProduct ? `Modified product '${payload.name}'` : `Created product '${payload.name}'`, "success");
        setIsEditingProduct(false);
        setCurrentProductId(null);
        resetProductForm();
        loadProducts();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to process product.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const resetProductForm = () => {
    setProdForm({
      name: "",
      category: "Attars",
      description: "",
      price: "",
      originalPrice: "",
      image: "",
      images: [],
      isBestSeller: false,
      isVisible: true,
      stock: "100",
      specifications: {
        concentration: "Pure Perfume Oil (Attar)",
        longevity: "12+ Hours",
        projection: "Strong",
        sillage: "Excellent",
        ingredients: "Natural Essential Oils, Oud, Musk",
        bottleType: "Octagonal Glass bottle with roll-on & glass applicator",
        packaging: "Premium wooden presentation casket with velvet lining"
      },
      features: [],
      brochureUrl: "",
      seoTitle: "",
      seoDescription: "",
      sizes: []
    });
  };

  const handleEditProductClick = (p: any) => {
    setIsEditingProduct(true);
    setCurrentProductId(p.id);

    // Normalize specifications and features JSON data
    let specs = p.specifications || {};
    if (typeof specs === "string") {
      try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
    }
    let feats = p.features || [];
    if (typeof feats === "string") {
      try { feats = JSON.parse(feats); } catch (e) { feats = []; }
    }
    let pImgs = p.images || [];
    if (typeof pImgs === "string") {
      try { pImgs = JSON.parse(pImgs); } catch (e) { pImgs = []; }
    }

    let sizes = p.sizes || [];
    if (typeof sizes === "string") {
      try { sizes = JSON.parse(sizes); } catch (e) { sizes = []; }
    }

    setProdForm({
      name: p.name || "",
      category: p.category || "Attars",
      description: p.description || "",
      price: p.price ? String(p.price) : "",
      originalPrice: p.original_price ? String(p.original_price) : (p.originalPrice ? String(p.originalPrice) : ""),
      image: p.image || "",
      images: Array.isArray(pImgs) ? pImgs : [],
      isBestSeller: p.is_best_seller === true || p.isBestSeller === true,
      isVisible: p.is_visible !== false && p.isVisible !== false,
      stock: p.stock ? String(p.stock) : "100",
      specifications: {
        concentration: specs.concentration || "Pure Perfume Oil (Attar)",
        longevity: specs.longevity || "12+ Hours",
        projection: specs.projection || "Strong",
        sillage: specs.sillage || "Excellent",
        ingredients: specs.ingredients || "Natural Essential Oils",
        bottleType: specs.bottleType || "Octagonal Glass bottle with roll-on",
        packaging: specs.packaging || "Premium presentation velvet box"
      },
      features: Array.isArray(feats) ? feats : [],
      brochureUrl: p.brochure_url || p.brochureUrl || "",
      seoTitle: p.seo_title || p.seoTitle || "",
      seoDescription: p.seo_description || p.seoDescription || "",
      sizes: Array.isArray(sizes) ? sizes.map((s: any) => ({
        size: s.size || "",
        price: String(s.price || ""),
        originalPrice: s.originalPrice ? String(s.originalPrice) : ""
      })) : []
    });
  };

  const handleDeleteProductClick = async (id: any) => {
    triggerConfirm("Decommission this fragrance from the public shop catalogue?", async () => {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
          showToast("Product retired from catalog.", "success");
          addActivity(`Retired product ID ${id}`, "info");
          loadProducts();
        } else {
          showToast("Failed to delete product.", "error");
        }
      } catch (err: any) {
        showToast(err.message, "error");
      }
    });
  };

  // Add highlight bullet point
  const handleAddFeature = () => {
    if (!tempFeature.trim()) return;
    setProdForm((prev) => ({
      ...prev,
      features: [...prev.features, tempFeature.trim()]
    }));
    setTempFeature("");
  };

  const handleRemoveFeature = (idx: number) => {
    setProdForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  // Edit custom key-value specifications
  const handleAddSpec = () => {
    if (!tempSpecKey.trim() || !tempSpecVal.trim()) return;
    setProdForm((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [tempSpecKey.trim()]: tempSpecVal.trim()
      }
    }));
    setTempSpecKey("");
    setTempSpecVal("");
  };

  const handleRemoveSpec = (key: string) => {
    setProdForm((prev) => {
      const nextSpecs = { ...prev.specifications };
      delete (nextSpecs as any)[key];
      return { ...prev, specifications: nextSpecs };
    });
  };

  // Manage additional multi-images
  const handleAddMultiImage = (url: string) => {
    if (!url.trim()) return;
    setProdForm((prev) => ({
      ...prev,
      images: [...prev.images, url.trim()]
    }));
  };

  const handleRemoveMultiImage = (idx: number) => {
    setProdForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  const handleMoveMultiImage = (idx: number, direction: 'left' | 'right') => {
    setProdForm((prev) => {
      const nextImages = [...prev.images];
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= nextImages.length) return prev;
      
      const temp = nextImages[idx];
      nextImages[idx] = nextImages[targetIdx];
      nextImages[targetIdx] = temp;
      
      return { ...prev, images: nextImages };
    });
  };

  const handleReplaceMultiImage = (idx: number, url: string) => {
    if (!url.trim()) return;
    setProdForm((prev) => {
      const nextImages = [...prev.images];
      nextImages[idx] = url.trim();
      return { ...prev, images: nextImages };
    });
  };

  // --- CATEGORY ACTION HANDLERS ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.title) {
      showToast("Category title is required.", "error");
      return;
    }

    try {
      let res;
      if (isEditingCategory && currentCategoryId) {
        res = await fetch(`/api/categories/${currentCategoryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catForm)
        });
      } else {
        res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catForm)
        });
      }

      if (res.ok) {
        showToast(isEditingCategory ? "Category refined!" : "New collection tier initialized!", "success");
        addActivity(isEditingCategory ? `Updated category '${catForm.title}'` : `Created category '${catForm.title}'`, "success");
        setIsEditingCategory(false);
        setCurrentCategoryId(null);
        setCatForm({ title: "", description: "", image: "" });
        loadCategories();
      } else {
        showToast("Error processing category.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteCategory = async (id: any) => {
    triggerConfirm("Retire this fragrance category collection? This does not delete associated products, but removes their group.", async () => {
      try {
        const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (res.ok) {
          showToast("Category group retired.", "success");
          addActivity(`Deleted category ID ${id}`, "info");
          loadCategories();
        } else {
          showToast("Error deleting category.", "error");
        }
      } catch (err: any) {
        showToast(err.message, "error");
      }
    });
  };

  const handleResetCategories = async () => {
    triggerConfirm("WARNING: This will permanently delete ALL categories and dummy data from both the database and fallback stores. Are you sure you want to proceed?", async () => {
      try {
        const res = await fetch("/api/categories", { method: "DELETE" });
        if (res.ok) {
          showToast("All categories and dummy data successfully removed.", "success");
          addActivity("Cleared all categories and dummy data", "warning");
          loadCategories();
        } else {
          showToast("Error resetting categories.", "error");
        }
      } catch (err: any) {
        showToast(err.message, "error");
      }
    });
  };

  // --- HOMEPAGE CONTENT TEXT FIELD SAVER ---
  const handleSaveHomepageText = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await websiteStore.updateHomepage(homeForm);
      showToast("Homepage layout content saved successfully!", "success");
      addActivity("Updated Homepage text section content", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to save homepage details.", "error");
    }
  };

  // --- MEDIA GALLERY HANDLERS ---
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;

    try {
      const res = await fetch("/api/media-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: newMediaUrl.trim() })
      });
      if (res.ok) {
        showToast("Asset registered in gallery list.", "success");
        setNewMediaUrl("");
        loadMedia();
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteMedia = async (id: any) => {
    triggerConfirm("Deregister this image from central media list?", async () => {
      try {
        const res = await fetch(`/api/media-library/${id}`, { method: "DELETE" });
        if (res.ok) {
          showToast("Asset deregistered successfully.", "success");
          loadMedia();
        }
      } catch (err: any) {
        showToast(err.message, "error");
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("URL copied to clipboard! Ready to use.", "success");
  };

  // --- DEV TOOLS NATIVE CODES ---
  const handleExecuteSql = async () => {
    setSqlLoading(true);
    setSqlError(null);
    setSqlResult(null);

    try {
      const res = await fetch("/api/db/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_sql: sqlQuery })
      });
      const data = await res.json();
      if (res.ok) {
        setSqlResult(data.rows || data);
        showToast("SQL instruction parsed successfully.", "success");
      } else {
        setSqlError(data.error || "Internal evaluation error.");
      }
    } catch (err: any) {
      setSqlError(err.message);
    } finally {
      setSqlLoading(false);
    }
  };

  const triggerTableSetup = async () => {
    triggerConfirm("This will configure all database tables and seed presets. Continue?", async () => {
      showToast("Initializing schemas and indices...");
      try {
        const res = await fetch("/api/db/setup", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Tables generated and default presets seeded!", "success");
          loadDbStatus();
          loadProducts();
        } else {
          showToast(data.error || "Failed database initial provision.", "error");
        }
      } catch (err: any) {
        showToast(err.message, "error");
      }
    });
  };

  const handleSeedPreset = async (presetName: string) => {
    const key = presetName === "Oud Collection" ? "attars" : presetName;
    showToast(`Seeding ${presetName} presets...`);
    try {
      const res = await fetch("/api/products/seed-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetName: key })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Successfully seeded preset!", "success");
        loadProducts();
      } else {
        showToast(data.error || "Failed to seed preset.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Filter products for display
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category.toLowerCase() === categoryFilter.toLowerCase();
    
    const isVisible = p.is_visible !== false && p.isVisible !== false;
    const matchesVisibility = visibilityFilter === "all" || 
                              (visibilityFilter === "visible" && isVisible) || 
                              (visibilityFilter === "hidden" && !isVisible);

    return matchesSearch && matchesCategory && matchesVisibility;
  }).sort((a, b) => {
    if (sortField === "name-asc") return a.name.localeCompare(b.name);
    if (sortField === "name-desc") return b.name.localeCompare(a.name);
    if (sortField === "price-asc") return (a.price || 0) - (b.price || 0);
    if (sortField === "price-desc") return (b.price || 0) - (a.price || 0);
    return 0;
  });

  // Render Login Card if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans">
        <Helmet>
          <title>Administrator Access | A.H.R Perfumes</title>
        </Helmet>

        {/* Ambient Backdrops */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-neutral-900/40 blur-2xl" />

        <div className="w-full max-w-md bg-neutral-900/80 border border-neutral-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10">
          
          {/* Logo Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center justify-center p-3 rounded-xl bg-gold-primary/10 border border-gold-primary/20 text-gold-primary mb-4">
              <Compass className="w-8 h-8" />
            </span>
            <h2 className="text-2xl font-serif tracking-widest text-gold-primary uppercase">A.H.R Perfumes</h2>
            <p className="text-xs tracking-wider text-neutral-400 mt-1 uppercase">Owner Secure Console</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 font-medium mb-1.5">Owner Email</label>
              <input
                type="email"
                required
                placeholder="owner@ahrperfumes.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-primary transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 font-medium mb-1.5">Secret Keyphrase</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-primary transition-all font-mono"
              />
            </div>

            {loginError && (
              <div className="flex items-start space-x-2 p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gold-primary hover:bg-gold-accent text-neutral-950 font-semibold py-3.5 px-4 rounded-lg tracking-widest text-xs uppercase transition-colors shadow-lg flex items-center justify-center space-x-2"
            >
              {loginLoading ? (
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In As Owner</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Sandbox Bypass */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-neutral-500 uppercase tracking-widest">or sandbox play</span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          <button
            onClick={handleBypass}
            className="w-full bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-gold-primary font-medium py-3 px-4 rounded-lg tracking-widest text-[11px] uppercase transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-gold-accent" />
            <span>Interactive Demo Bypass</span>
          </button>
          
          <div className="text-center mt-6">
            <p className="text-[10px] text-neutral-500 leading-relaxed uppercase tracking-wider">
              Protected by A.H.R Secure Gate. Default bypass passcode: <span className="text-gold-accent font-mono">admin123</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active Dashboard Panel once authenticated
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-800 flex flex-col font-sans relative">
      <Helmet>
        <title>Owner Dashboard | A.H.R Perfumes Indore</title>
      </Helmet>

      {/* Floating Status Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center space-x-3 px-6 py-4.5 rounded-xl border shadow-xl backdrop-blur-md max-w-md w-11/12"
            style={{
              backgroundColor: toast.type === "success" ? "rgba(236, 253, 245, 0.95)" : "rgba(254, 242, 242, 0.95)",
              borderColor: toast.type === "success" ? "#a7f3d0" : "#fecaca",
              color: toast.type === "success" ? "#065f46" : "#991b1b"
            }}
          >
            {toast.type === "success" ? (
              <Check className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            )}
            <p className="text-xs font-semibold uppercase tracking-wider leading-relaxed">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="bg-white border-b border-[#F0EAE1] h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-gold-accent flex-shrink-0" />
            <h1 className="font-serif text-sm sm:text-lg tracking-widest text-[#111111] uppercase font-bold">
              A.H.R <span className="hidden min-[400px]:inline">Perfumes</span>
            </h1>
            <span className="bg-[#FAF3E5] border border-[#ECD9B9] text-gold-accent text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
              Owner
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <LinkIcon className="w-4 h-4 text-emerald-600 hidden min-[400px]:block" />
          <span className="text-xs text-neutral-500 tracking-wider hidden md:inline uppercase font-medium">
            Live Preview Synchronized
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-red-600 transition-colors uppercase font-semibold tracking-wider bg-neutral-50 hover:bg-red-50 border border-neutral-200 px-3 py-1.5 rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Top Page Tabs selection (replacing left sidebar completely) */}
      <div className="bg-[#FAF8F5] border-b border-[#F0EAE1] sticky top-16 z-20 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex space-x-6 sm:space-x-8 overflow-x-auto py-3.5 scrollbar-none">
            {[
              { id: "home", label: "Home Page", icon: Home },
              { id: "shop", label: "Shop / Products", icon: ShoppingBag },
              { id: "categories", label: "Categories", icon: Layers },
              { id: "about", label: "About Brand", icon: Info },
              { id: "gallery", label: "Gallery / Story", icon: ImageIcon },
              { id: "contact", label: "Contact Details", icon: Compass },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 pb-1.5 text-xs uppercase tracking-widest font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "border-gold-primary text-gold-accent font-extrabold"
                      : "border-transparent text-neutral-400 hover:text-neutral-700 hover:border-neutral-200"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Stage Area */}
      <main className="flex-1 overflow-y-auto max-w-[1600px] w-full mx-auto p-4 sm:p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="space-y-8"
          >

              {/* TAB 1: HOME PAGE */}
              {activeTab === "home" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif text-[#111111] uppercase tracking-wider font-semibold">Home Page Content</h2>
                    <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Configure slides, interactive hero layouts, features lists, and brand highlights</p>
                  </div>

                  <div className="w-full">
                    <WebsiteSectionEditor showToast={showToast} forcePageTab="home" />
                  </div>
                </div>
              )}

              {/* TAB 2: SHOP PAGE & PRODUCTS */}
              {activeTab === "shop" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-serif text-[#111111] uppercase tracking-wider font-semibold">Shop Page & Inventory</h2>
                      <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Manage active fragrance profiles, pricing tiers, and main shop banner sections</p>
                    </div>
                    
                    {!isEditingProduct && (
                      <button 
                        onClick={() => { resetProductForm(); setIsEditingProduct(true); setCurrentProductId(null); }}
                        className="bg-gold-primary hover:bg-gold-accent text-neutral-950 px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center space-x-2 shadow-xs ml-auto sm:ml-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Launch Fragrance</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 space-y-8">

                      {/* Inline / Modal Edit and Add Form */}
                  {isEditingProduct && (
                    <div className="bg-white border border-gold-primary/30 rounded-2xl p-6 shadow-lg space-y-6">
                      <div className="flex items-center justify-between border-b border-[#F7F4EE] pb-3">
                        <h3 className="font-serif text-md uppercase tracking-wider text-gold-accent font-bold">
                          {currentProductId ? "Edit Fragrance profile" : "Create Fragrance Profile"}
                        </h3>
                        <button 
                          onClick={() => { setIsEditingProduct(false); resetProductForm(); }}
                          className="text-neutral-400 hover:text-neutral-600 font-bold uppercase text-xs tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={handleSaveProduct} className="space-y-6">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Fragrance Title</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Oud Royal Attar"
                              value={prodForm.name}
                              onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                              className="w-full bg-neutral-50 border border-neutral-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Category Group</label>
                            <select 
                              value={prodForm.category}
                              onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                              className="w-full bg-neutral-50 border border-neutral-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold-primary font-semibold text-neutral-600"
                            >
                              <option value="Attars">Attars (Concentrated Oils)</option>
                              <option value="Perfumes">Perfumes (Luxury Sprays)</option>
                              <option value="Bakhoor">Bakhoor (Incense)</option>
                              <option value="Gift Sets">Gift Sets</option>
                              <option value="Uncategorized">Uncategorized</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Stock Capacity</label>
                            <input 
                              type="number" 
                              placeholder="100"
                              value={prodForm.stock}
                              onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                              className="w-full bg-neutral-50 border border-neutral-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold-primary"
                            />
                          </div>
                        </div>

                        {/* Row 2: Price Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Regular Price (INR)</label>
                            <input 
                              type="number" 
                              required
                              placeholder="e.g. 1500"
                              value={prodForm.price}
                              onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                              className="w-full bg-neutral-50 border border-neutral-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Original / Comparison Price (Optional)</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 2000 (shows sale tag)"
                              value={prodForm.originalPrice}
                              onChange={(e) => setProdForm({ ...prodForm, originalPrice: e.target.value })}
                              className="w-full bg-neutral-50 border border-neutral-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold-primary"
                            />
                          </div>

                          <div className="flex items-center space-x-6 pt-6">
                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={prodForm.isBestSeller}
                                onChange={(e) => setProdForm({ ...prodForm, isBestSeller: e.target.checked })}
                                className="rounded border-neutral-300 text-gold-primary focus:ring-gold-primary h-4.5 w-4.5"
                              />
                              <span className="text-xs uppercase tracking-widest text-neutral-600 font-bold">Best Seller Badge</span>
                            </label>

                            <label className="flex items-center space-x-2.5 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={prodForm.isVisible}
                                onChange={(e) => setProdForm({ ...prodForm, isVisible: e.target.checked })}
                                className="rounded border-neutral-300 text-gold-primary focus:ring-gold-primary h-4.5 w-4.5"
                              />
                              <span className="text-xs uppercase tracking-widest text-neutral-600 font-bold">Visible on Website</span>
                            </label>
                          </div>
                        </div>

                        {/* Volume Sizes & Custom Pricing (INR according to ml/volume) */}
                        <div className="bg-[#FAF9F6] border border-[#F0EAE1] p-5 rounded-xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-700 flex items-center space-x-2">
                                <span>Volume Sizes & Custom Pricing (ml)</span>
                                <span className="bg-gold-primary text-neutral-900 text-[10px] px-2 py-0.5 rounded font-mono font-bold">New</span>
                              </h4>
                              <p className="text-[11px] text-neutral-500 mt-0.5">Define exact prices for volume options (e.g. 3ml, 6ml, 12ml, 50ml, 100ml). If configured, these override generic auto-scaling multipliers.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const currentSizes = prodForm.sizes || [];
                                setProdForm({
                                  ...prodForm,
                                  sizes: [...currentSizes, { size: "50ml", price: "", originalPrice: "" }]
                                });
                              }}
                              className="bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center space-x-1 self-start sm:self-center transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add ML Size Price</span>
                            </button>
                          </div>

                          {prodForm.sizes && prodForm.sizes.length > 0 ? (
                            <div className="space-y-3">
                              {prodForm.sizes.map((s, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row items-end sm:items-center gap-3 bg-white p-3 border border-neutral-200 rounded-lg">
                                  <div className="w-full sm:w-1/3">
                                    <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Volume Size (e.g., 50ml)</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. 12ml or 50ml"
                                      required
                                      value={s.size}
                                      onChange={(e) => {
                                        const updated = [...prodForm.sizes];
                                        updated[idx].size = e.target.value;
                                        setProdForm({ ...prodForm, sizes: updated });
                                      }}
                                      className="w-full bg-neutral-50 border border-neutral-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-gold-primary"
                                    />
                                  </div>

                                  <div className="w-full sm:w-1/3">
                                    <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Custom Price (INR)</label>
                                    <input
                                      type="number"
                                      placeholder="INR Price"
                                      required
                                      value={s.price}
                                      onChange={(e) => {
                                        const updated = [...prodForm.sizes];
                                        updated[idx].price = e.target.value;
                                        setProdForm({ ...prodForm, sizes: updated });
                                      }}
                                      className="w-full bg-neutral-50 border border-neutral-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-gold-primary"
                                    />
                                  </div>

                                  <div className="w-full sm:w-1/3">
                                    <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Orig. Price (INR / Optional)</label>
                                    <input
                                      type="number"
                                      placeholder="Original Price"
                                      value={s.originalPrice || ""}
                                      onChange={(e) => {
                                        const updated = [...prodForm.sizes];
                                        updated[idx].originalPrice = e.target.value;
                                        setProdForm({ ...prodForm, sizes: updated });
                                      }}
                                      className="w-full bg-neutral-50 border border-neutral-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-gold-primary"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = prodForm.sizes.filter((_, i) => i !== idx);
                                      setProdForm({ ...prodForm, sizes: updated });
                                    }}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Remove Option"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-5 text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-lg bg-white">
                              No custom size pricing tiers configured yet. Using default category-based auto-multipliers.
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Brand Story & Description</label>
                          <textarea 
                            rows={3}
                            placeholder="Provide deep descriptions of scent family, top notes, heart notes, and base notes..."
                            value={prodForm.description}
                            onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                            className="w-full bg-neutral-50 border border-neutral-200 text-sm rounded-lg p-4 focus:outline-none focus:border-gold-primary"
                          />
                        </div>

                        {/* Primary Image Upload */}
                        <div className="bg-[#FAF9F6] border border-[#F0EAE1] p-5 rounded-xl space-y-4">
                          <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-700">Fragrance Images Configuration</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Primary Featured Image</label>
                              <div className="flex items-center space-x-4 bg-white p-3 border border-neutral-200 rounded-lg">
                                {prodForm.image ? (
                                  <div className="relative w-16 h-16 rounded-md border border-neutral-300 overflow-hidden bg-neutral-50">
                                    <img src={prodForm.image || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <button 
                                      type="button"
                                      onClick={() => setProdForm({ ...prodForm, image: "" })}
                                      className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[10px] font-bold"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-md border border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 text-neutral-400 text-[10px] font-semibold">
                                    No Image
                                  </div>
                                )}
                                <label className="cursor-pointer bg-neutral-900 text-white hover:bg-gold-primary hover:text-black transition-colors px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1 border">
                                  <Upload className="w-4 h-4" />
                                  <span>Upload File</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleUploadImage(e, (url) => setProdForm({ ...prodForm, image: url }), "product")}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Additional Images (carousel support) */}
                            <div className="md:col-span-2">
                              <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">
                                Additional Images / Product Gallery (Upload, reorder, replace)
                              </label>
                              
                              <div className="flex flex-col sm:flex-row gap-3">
                                <label className="cursor-pointer bg-neutral-900 text-white hover:bg-gold-primary hover:text-black transition-colors px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center space-x-2 border justify-center">
                                  <Upload className="w-4 h-4" />
                                  <span>Upload Image File to Gallery</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleUploadImage(e, (url) => handleAddMultiImage(url), "product")}
                                  />
                                </label>
                              </div>

                              {prodForm.images && prodForm.images.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4 bg-white p-3 border border-neutral-200 rounded-lg">
                                  {prodForm.images.map((imgUrl, idx) => (
                                    <div key={idx} className="relative group rounded-md border border-neutral-200 overflow-hidden bg-neutral-50 flex flex-col h-28">
                                      <div className="relative flex-1 bg-white overflow-hidden">
                                        <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                                          #{idx + 1}
                                        </div>
                                      </div>
                                      <div className="bg-neutral-50 border-t border-neutral-200 flex items-center justify-around py-1 px-0.5 text-neutral-500">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={() => handleMoveMultiImage(idx, 'left')}
                                          className="p-1 hover:text-gold-accent disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
                                          title="Move Left"
                                        >
                                          <ArrowLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <label className="p-1 hover:text-gold-accent cursor-pointer transition-colors" title="Replace with Upload">
                                          <RefreshCw className="w-3.5 h-3.5" />
                                          <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => handleUploadImage(e, (url) => handleReplaceMultiImage(idx, url), "product")}
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          disabled={idx === prodForm.images.length - 1}
                                          onClick={() => handleMoveMultiImage(idx, 'right')}
                                          className="p-1 hover:text-gold-accent disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
                                          title="Move Right"
                                        >
                                          <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveMultiImage(idx)}
                                          className="p-1 hover:text-red-600 transition-colors"
                                          title="Remove Image"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-neutral-400 text-xs border border-dashed border-neutral-200 rounded-lg mt-3 bg-white">
                                  No additional images added yet. Click Upload File to build this product's gallery.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>



                        {/* Submit Button */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-[#F7F4EE]">
                          <button 
                            type="button" 
                            onClick={() => { setIsEditingProduct(false); resetProductForm(); }}
                            className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs uppercase tracking-widest font-bold rounded-lg"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-6 py-2.5 bg-gold-primary hover:bg-gold-accent text-neutral-950 text-xs uppercase tracking-widest font-bold rounded-lg shadow-xs"
                          >
                            Save Fragrance Profile
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Filters, search, catalogs */}
                  <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Search */}
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                          <Search className="w-4 h-4" />
                        </span>
                        <input 
                          type="text" 
                          placeholder="Search product inventory..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-[#FAF9F6] border border-neutral-200 text-xs rounded-xl focus:outline-none focus:border-gold-primary"
                        />
                      </div>

                      {/* Filter category */}
                      <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-[#FAF9F6] border border-neutral-200 text-xs rounded-xl px-4 py-2.5 font-semibold text-neutral-600 focus:outline-none"
                      >
                        <option value="all">All Categories</option>
                        <option value="Attars">Attars</option>
                        <option value="Perfumes">Perfumes</option>
                        <option value="Bakhoor">Bakhoor</option>
                        <option value="Gift Sets">Gift Sets</option>
                      </select>

                      {/* Filter Visibility */}
                      <select 
                        value={visibilityFilter}
                        onChange={(e) => setVisibilityFilter(e.target.value)}
                        className="bg-[#FAF9F6] border border-neutral-200 text-xs rounded-xl px-4 py-2.5 font-semibold text-neutral-600 focus:outline-none"
                      >
                        <option value="all">All Visibility</option>
                        <option value="visible">Visible Only</option>
                        <option value="hidden">Hidden Only</option>
                      </select>

                      {/* Sort field */}
                      <select 
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className="bg-[#FAF9F6] border border-neutral-200 text-xs rounded-xl px-4 py-2.5 font-semibold text-neutral-600 focus:outline-none"
                      >
                        <option value="name-asc">Sort: A-Z</option>
                        <option value="name-desc">Sort: Z-A</option>
                        <option value="price-asc">Sort: Price Low-High</option>
                        <option value="price-desc">Sort: Price High-Low</option>
                      </select>
                    </div>

                    {/* Products inventory table */}
                    <div className="overflow-x-auto border border-[#FAF6EE] rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#FAF9F6] border-b border-[#F0EAE1] text-neutral-500 uppercase tracking-widest font-bold">
                            <th className="py-3 px-4">Fragrance</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Regular Price</th>
                            <th className="py-3 px-4">Orig Price</th>
                            <th className="py-3 px-4">Visibility</th>
                            <th className="py-3 px-4">Best Seller</th>
                            <th className="py-3 px-4">Stock</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {loadingProducts ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-neutral-400">
                                <div className="w-6 h-6 border-2 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <span>Loading perfume recipes...</span>
                              </td>
                            </tr>
                          ) : filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-neutral-400 uppercase tracking-widest font-semibold">
                                No matching fragrances found.
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((p) => {
                              const isVis = p.is_visible !== false && p.isVisible !== false;
                              return (
                                <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 rounded border border-neutral-200 overflow-hidden flex-shrink-0">
                                        <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                      <div>
                                        <span className="font-serif font-bold text-neutral-800 text-sm block">{p.name}</span>
                                        {p.brochure_url || p.brochureUrl ? (
                                          <span className="text-[10px] text-[#A98E56] font-medium flex items-center space-x-0.5">
                                            <FileDown className="w-3 h-3" />
                                            <span>Brochure attached</span>
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-neutral-600 uppercase tracking-wider">{p.category}</td>
                                  <td className="py-3 px-4 font-mono font-semibold">₹{p.price}</td>
                                  <td className="py-3 px-4 font-mono text-neutral-400">
                                    {p.original_price ? `₹${p.original_price}` : (p.originalPrice ? `₹${p.originalPrice}` : "-")}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                      isVis ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                                    }`}>
                                      {isVis ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                      <span>{isVis ? "Visible" : "Hidden"}</span>
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    {(p.is_best_seller || p.isBestSeller) ? (
                                      <span className="bg-[#FAF3E5] border border-[#ECD9B9] text-gold-accent text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Best Seller
                                      </span>
                                    ) : "-"}
                                  </td>
                                  <td className="py-3 px-4 font-mono">{p.stock || 100}</td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button 
                                        onClick={() => handleEditProductClick(p)}
                                        className="bg-neutral-50 hover:bg-neutral-100 border text-neutral-600 px-2 py-1 rounded-md"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteProductClick(p.id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-2 py-1 rounded-md"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Shop Banner Customizer Right Rail */}
                <div className="xl:col-span-4">
                  <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
                    <div className="flex items-center space-x-2 border-b border-[#F7F4EE] pb-3 mb-4">
                      <ShoppingBag className="w-4 h-4 text-gold-accent" />
                      <h3 className="font-serif text-xs uppercase tracking-widest text-[#111111] font-bold">
                        Shop Banner Content
                      </h3>
                    </div>
                    <WebsiteSectionEditor showToast={showToast} forcePageTab="shop" />
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* TAB 4: CATEGORY MANAGEMENT */}
              {activeTab === "categories" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-serif text-[#111111] uppercase tracking-wider">Category Tier Management</h2>
                      <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Refine product collection groups and display covers</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 ml-auto sm:ml-0">
                      <button 
                        onClick={handleResetCategories}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center space-x-2 shadow-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear All Categories</span>
                      </button>

                      {!isEditingCategory && (
                        <button 
                          onClick={() => { setIsEditingCategory(true); setCurrentCategoryId(null); setCatForm({ title: "", description: "", image: "" }); }}
                          className="bg-gold-primary hover:bg-gold-accent text-neutral-950 px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center space-x-2 shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Category</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 space-y-8">

                      {/* Add / Edit Form */}
                  {isEditingCategory && (
                    <div className="bg-white border border-gold-primary/30 rounded-2xl p-6 shadow-lg space-y-6">
                      <h3 className="font-serif text-md uppercase tracking-wider text-gold-accent font-bold">
                        {currentCategoryId ? "Edit Category Tier" : "Create Category Tier"}
                      </h3>

                      <form onSubmit={handleSaveCategory} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Category Title</label>
                            <input 
                              type="text" 
                              required
                              value={catForm.title}
                              onChange={(e) => setCatForm({ ...catForm, title: e.target.value })}
                              className="w-full bg-neutral-50 border border-neutral-200 text-sm rounded-lg px-4 py-2.5"
                            />
                          </div>

                          <div>
                            <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Cover Image</label>
                            <div className="flex items-center space-x-3 bg-neutral-50 border border-neutral-200 p-2.5 rounded-lg">
                              {catForm.image ? (
                                <div className="relative w-12 h-12 rounded-md border border-neutral-300 overflow-hidden bg-neutral-100 flex-shrink-0">
                                  <img src={catForm.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <button 
                                    type="button"
                                    onClick={() => setCatForm({ ...catForm, image: "" })}
                                    className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[10px] font-bold"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-md border border-dashed border-neutral-300 flex items-center justify-center bg-white text-neutral-400 text-[10px] font-semibold flex-shrink-0">
                                  No Image
                                </div>
                              )}
                              <label className="cursor-pointer bg-neutral-900 text-white hover:bg-gold-primary hover:text-black transition-colors px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1 border">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload File</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleUploadImage(e, (url) => setCatForm({ ...catForm, image: url }), "category")}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Description Summary</label>
                          <textarea 
                            rows={2}
                            value={catForm.description}
                            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                            className="w-full bg-neutral-50 border border-neutral-200 text-sm rounded-lg p-4"
                          />
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button 
                            type="button" 
                            onClick={() => setIsEditingCategory(false)}
                            className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs uppercase rounded"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-gold-primary text-neutral-950 text-xs uppercase font-bold rounded"
                          >
                            Save Category
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Categories inventory view */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loadingCategories ? (
                      <div className="col-span-full text-center py-8 text-neutral-400">Loading Categories...</div>
                    ) : categories.length === 0 ? (
                      <div className="col-span-full text-center py-12 bg-white border border-dashed border-neutral-200 rounded-2xl p-8">
                        <div className="text-neutral-400 mb-3">
                          <Plus className="w-8 h-8 mx-auto stroke-1 text-gold-accent" />
                        </div>
                        <h4 className="font-serif font-bold text-neutral-700 uppercase tracking-wider text-sm mb-1">No Categories Found</h4>
                        <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">You have successfully removed all categories and dummy data. Click "Create Category" to build your custom categories from scratch!</p>
                      </div>
                    ) : categories.map((cat) => (
                      <div key={cat.id || cat.title} className="bg-white border border-[#F0EAE1] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="w-full h-32 rounded-xl overflow-hidden border border-neutral-100 mb-4">
                            <img src={cat.image} className="w-full h-full object-cover" />
                          </div>
                          <h4 className="font-serif font-bold text-neutral-800 uppercase tracking-widest text-sm">{cat.title}</h4>
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{cat.description || "No summary provided."}</p>
                        </div>

                        <div className="flex items-center justify-end space-x-2 mt-6 border-t border-neutral-100 pt-4">
                          <button 
                            onClick={() => {
                              setIsEditingCategory(true);
                              setCurrentCategoryId(cat.id || cat.title);
                              setCatForm({ title: cat.title, description: cat.description || "", image: cat.image || "" });
                            }}
                            className="text-xs bg-neutral-50 hover:bg-neutral-100 border text-neutral-600 px-3 py-1.5 rounded-md"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id || cat.title)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-3 py-1.5 rounded-md"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

                    {/* Category Page Banner Right Rail */}
                    <div className="xl:col-span-4">
                      <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center space-x-2 border-b border-[#F7F4EE] pb-3 mb-4">
                          <Layers className="w-4 h-4 text-gold-accent" />
                          <h3 className="font-serif text-xs uppercase tracking-widest text-[#111111] font-bold">
                            Category Page Banner
                          </h3>
                        </div>
                        <WebsiteSectionEditor showToast={showToast} forcePageTab="categories" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ABOUT PAGE */}
              {activeTab === "about" && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif text-[#111111] uppercase tracking-wider font-semibold">About Page Content</h2>
                    <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Refine narrative details, company story highlights, and core values declarations</p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8">
                      <WebsiteSectionEditor showToast={showToast} forcePageTab="about" />
                    </div>

                    <div className="xl:col-span-4 space-y-6">
                      <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center space-x-2 border-b border-[#F7F4EE] pb-3 mb-5">
                          <Compass className="w-4 h-4 text-gold-accent" />
                          <h3 className="font-serif text-xs uppercase tracking-widest text-[#111111] font-bold">About Narrative</h3>
                        </div>
                        <form onSubmit={handleSaveHomepageText} className="space-y-5">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Our Story Summary</label>
                            <textarea 
                              rows={5}
                              value={homeForm.aboutSection}
                              onChange={(e) => setHomeForm({ ...homeForm, aboutSection: e.target.value })}
                              className="w-full bg-[#FAF9F6] border border-neutral-200 text-xs rounded-lg p-3 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Mission & Vision Declaration</label>
                            <textarea 
                              rows={5}
                              value={homeForm.missionVision}
                              onChange={(e) => setHomeForm({ ...homeForm, missionVision: e.target.value })}
                              className="w-full bg-[#FAF9F6] border border-neutral-200 text-xs rounded-lg p-3 focus:outline-none"
                            />
                          </div>
                          <button 
                            type="submit"
                            className="w-full bg-gold-primary hover:bg-gold-accent text-neutral-950 px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            Save Narratives
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GALLERY PAGE */}
              {activeTab === "gallery" && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif text-[#111111] uppercase tracking-wider font-semibold">Gallery & Visual Story</h2>
                    <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Configure active photos, Instagram lookbooks, and custom section backgrounds</p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 space-y-8">
                      {/* Register/Add New Image Form */}
                      <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-800 flex items-center space-x-2">
                          <Plus className="w-4 h-4 text-gold-accent" />
                          <span>Register New Instagram Reel</span>
                        </h3>

                        <form onSubmit={handleAddGalleryImage} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-600">Instagram Reel URL</label>
                              <input
                                type="url"
                                required
                                placeholder="https://www.instagram.com/reel/..."
                                value={newGalleryInstagramUrl}
                                onChange={(e) => setNewGalleryInstagramUrl(e.target.value)}
                                className="w-full bg-[#FAF9F6] border border-neutral-200 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-gold-primary"
                              />
                              <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider">Example: https://www.instagram.com/reel/C8gH3XgS9p_/</p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-600">Premium Video / Image (Optional)</label>
                              <div className="flex items-center space-x-4 bg-[#FAF9F6] border border-neutral-200 p-3 rounded-xl">
                                {newGalleryUrl ? (
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-300 bg-black">
                                    {newGalleryUrl.toLowerCase().endsWith(".mp4") || newGalleryUrl.toLowerCase().endsWith(".mov") || newGalleryUrl.includes("video") ? (
                                      <video src={newGalleryUrl} className="w-full h-full object-cover" muted playsInline />
                                    ) : (
                                      <img src={newGalleryUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    )}
                                    <button 
                                      type="button"
                                      onClick={() => setNewGalleryUrl("")}
                                      className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-lg border border-dashed border-neutral-300 bg-white flex items-center justify-center text-[9px] text-neutral-400 font-semibold text-center leading-tight p-1">
                                    No Custom Asset
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => visualStoryInputRef.current?.click()}
                                  className="bg-neutral-900 text-white hover:bg-gold-primary hover:text-black transition-colors px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 border"
                                >
                                  <Upload className="w-3.5 h-3.5 text-gold-accent" />
                                  <span>Upload File</span>
                                </button>
                                <input
                                  ref={visualStoryInputRef}
                                  type="file"
                                  accept="image/*,video/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    handleUploadImage(e, (url) => {
                                      setNewGalleryUrl(url);
                                      showToast("Asset uploaded successfully! Click Add Reel to register.", "success");
                                    });
                                  }}
                                />
                              </div>
                              <p className="text-[9px] text-neutral-400 mt-1 uppercase tracking-wider leading-relaxed">
                                Upload a raw .mp4 video for 100% clean, branding-free, auto-looping playback on the site!
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              className="bg-neutral-800 hover:bg-neutral-900 text-white px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-bold flex items-center space-x-2"
                            >
                              <Plus className="w-4 h-4 text-gold-accent" />
                              <span>Add Reel to Gallery</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Gallery Items Grid */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-800">
                          Active Instagram Reels ({galleryList.length})
                        </h3>

                        {loadingGallery ? (
                          <div className="text-center py-12 text-neutral-400">Loading Reels...</div>
                        ) : galleryList.length === 0 ? (
                          <div className="text-center py-12 bg-white border border-dashed rounded-2xl text-neutral-400 uppercase tracking-widest font-bold text-xs">
                            No Instagram Reels found.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {galleryList.map((item) => {
                              const instagramUrl = item.instagram_url || item.instagramUrl || item.image_url || item.imageUrl || "";
                              const getReelShortcode = (url: string) => {
                                if (!url) return "";
                                const match = url.match(/(?:instagram\.com\/(?:p|reel|tv)\/)([a-zA-Z0-9_\-]+)/i);
                                return match ? match[1] : "";
                              };
                              const shortcode = getReelShortcode(instagramUrl);
                              const embedUrl = shortcode ? `https://www.instagram.com/reel/${shortcode}/embed/` : "";
                              const isEditing = editingGalleryId === item.id;

                              return (
                                <div
                                  key={item.id}
                                  className="bg-white border border-[#F0EAE1] rounded-2xl overflow-hidden shadow-xs flex flex-col h-full"
                                >
                                  {/* Preview Area */}
                                  <div className="relative aspect-[9/16] bg-neutral-900 overflow-hidden flex-1">
                                    {embedUrl ? (
                                      <div className="absolute inset-0 w-full h-full overflow-hidden">
                                        <iframe
                                          src={embedUrl}
                                          className="absolute border-0 select-none pointer-events-none"
                                          style={{
                                            top: "-45px",
                                            left: "-1px",
                                            width: "calc(100% + 2px)",
                                            height: "calc(100% + 105px)",
                                          }}
                                          scrolling="no"
                                          allowFullScreen
                                        />
                                        <div className="absolute inset-0 z-10 bg-transparent" />
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs p-4 text-center">
                                        <Video className="w-8 h-8 mb-2 text-neutral-600" />
                                        <span>Invalid Reel URL</span>
                                      </div>
                                    )}
                                    
                                    {/* Sort Badge */}
                                    <div className="absolute top-2 left-2 z-20 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                                      Order: {item.sort_order || 0}
                                    </div>
                                  </div>

                                  {/* Info and controls */}
                                  <div className="p-3 bg-neutral-50 border-t border-[#F0EAE1] space-y-2">
                                    {isEditing ? (
                                      <div className="space-y-2">
                                        <input
                                          type="url"
                                          className="w-full bg-white border border-neutral-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold-primary"
                                          value={editGalleryForm.instagram_url}
                                          onChange={(e) => setEditGalleryForm({
                                            ...editGalleryForm,
                                            instagram_url: e.target.value,
                                            image_url: e.target.value
                                          })}
                                        />
                                        <div className="flex space-x-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleSaveEditGallery(item.id)}
                                            className="flex-1 bg-neutral-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingGalleryId(null)}
                                            className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <p className="text-[10px] text-neutral-500 truncate" title={instagramUrl}>
                                          {instagramUrl}
                                        </p>
                                        <div className="flex space-x-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditGallery(item)}
                                            className="flex-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md flex items-center justify-center space-x-1"
                                          >
                                            <Pencil className="w-3 h-3 text-gold-accent" />
                                            <span>Edit</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteGalleryImage(item.id)}
                                            className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md flex items-center justify-center space-x-1"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                            <span>Delete</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="xl:col-span-4">
                      <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center space-x-2 border-b border-[#F7F4EE] pb-3 mb-4">
                          <ImageIcon className="w-4 h-4 text-gold-accent" />
                          <h3 className="font-serif text-xs uppercase tracking-widest text-[#111111] font-bold">
                            Gallery Banner & Title
                          </h3>
                        </div>
                        <WebsiteSectionEditor showToast={showToast} forcePageTab="gallery_page" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CONTACT PAGE */}
              {activeTab === "contact" && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif text-[#111111] uppercase tracking-wider font-semibold">Contact & Location Coords</h2>
                    <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Sync showroom physical locations, phone connections, and layout texts</p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8">
                      <WebsiteSectionEditor showToast={showToast} forcePageTab="contact" />
                    </div>

                    <div className="xl:col-span-4 space-y-6">
                      <div className="bg-white border border-[#F0EAE1] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center space-x-2 border-b border-[#F7F4EE] pb-3 mb-5">
                          <MapPin className="w-4 h-4 text-gold-accent" />
                          <h3 className="font-serif text-xs uppercase tracking-widest text-[#111111] font-bold">Coordinates Settings</h3>
                        </div>
                        <form onSubmit={handleSaveHomepageText} className="space-y-5">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Physical Showroom Address</label>
                            <input 
                              type="text" 
                              value={homeForm.contactInfo.address}
                              onChange={(e) => setHomeForm({
                                ...homeForm,
                                contactInfo: { ...homeForm.contactInfo, address: e.target.value }
                              })}
                              className="w-full bg-[#FAF9F6] border border-neutral-200 text-xs rounded-lg px-3 py-2.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5">WhatsApp Contact Line</label>
                            <input 
                              type="text" 
                              value={homeForm.contactInfo.phone}
                              onChange={(e) => setHomeForm({
                                ...homeForm,
                                contactInfo: { ...homeForm.contactInfo, phone: e.target.value }
                              })}
                              className="w-full bg-[#FAF9F6] border border-neutral-200 text-xs rounded-lg px-3 py-2.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Support Email</label>
                            <input 
                              type="text" 
                              value={homeForm.contactInfo.email}
                              onChange={(e) => setHomeForm({
                                ...homeForm,
                                contactInfo: { ...homeForm.contactInfo, email: e.target.value }
                              })}
                              className="w-full bg-[#FAF9F6] border border-neutral-200 text-xs rounded-lg px-3 py-2.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5">Instagram Handle ID</label>
                            <input 
                              type="text" 
                              value={homeForm.contactInfo.instagram}
                              onChange={(e) => setHomeForm({
                                ...homeForm,
                                contactInfo: { ...homeForm.contactInfo, instagram: e.target.value }
                              })}
                              className="w-full bg-[#FAF9F6] border border-neutral-200 text-xs rounded-lg px-3 py-2.5"
                            />
                          </div>
                          <button 
                            type="submit"
                            className="w-full bg-gold-primary hover:bg-gold-accent text-neutral-950 px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            Sync Contact Coords
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>

      {/* Premium Custom Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white border border-[#F0EAE1] max-w-sm w-full rounded-2xl p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-serif text-neutral-900 mb-2">Are you sure?</h3>
            <p className="text-xs text-neutral-600 mb-6 font-sans leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
