import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { db, isDbConfigured, pool } from "./src/db/index";
import { products, cartItems, businessInfo, categories, testimonials, faqs, galleryImages, users, inquiries } from "./src/db/schema";
import { 
  products as staticProducts,
  businessInfo as staticBusinessInfo,
  categories as staticCategories,
  testimonials as staticTestimonials,
  faqs as staticFaqs,
  galleryImages as staticGalleryImages
} from "./src/data";
import { eq, and } from "drizzle-orm";


// Clean environment variables (handling quotes, whitespace, carriage returns, or accidental prepended variable names)
const cleanEnvVar = (val: string | undefined): string | undefined => {
  if (!val) return undefined;
  let clean = val.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1);
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.slice(1, -1);
  }
  clean = clean.trim();
  
  // Strip any accidental prepended variable name e.g. "VITE_SUPABASE_URL=https://..." or "SUPABASE_URL=https://..."
  const eqIdx = clean.indexOf("=");
  if (eqIdx !== -1) {
    const prefix = clean.substring(0, eqIdx).trim();
    if (/^[A-Z0-9_]+$/i.test(prefix)) {
      clean = clean.substring(eqIdx + 1).trim();
    }
  }
  
  // Clean quotes again if they were inside the value after the equals sign
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1);
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.slice(1, -1);
  }
  return clean.trim();
};

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return computedHash === hash;
}

const SUPABASE_URL = cleanEnvVar(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY);
const SUPABASE_STORAGE_BUCKET = cleanEnvVar(process.env.SUPABASE_STORAGE_BUCKET || "website-images");
const SUPABASE_ANON_KEY = cleanEnvVar(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

const isValidSupabaseUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
};

const isValidJwt = (token: string | undefined): boolean => {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const headerDecoded = Buffer.from(parts[0], "base64").toString("utf8");
    const parsed = JSON.parse(headerDecoded);
    return typeof parsed === "object" && parsed !== null && ("alg" in parsed || "typ" in parsed);
  } catch (e) {
    return false;
  }
};

let supabaseClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && isValidSupabaseUrl(SUPABASE_URL) && isValidJwt(SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

const handleSupabaseError = (err: any) => {
  const errMsg = err?.message || String(err);
  if (
    errMsg.includes("JWS Protected Header is invalid") ||
    errMsg.includes("Invalid token") ||
    errMsg.includes("Invalid API key") ||
    err?.status === 401 ||
    err?.statusCode === 401
  ) {
    console.warn("[Supabase Server Client] Invalid token or authentication error detected. Disabling Supabase client to prevent error logs.");
    supabaseClient = null;
  }
};

console.log("=== SUPABASE SERVER ENVIRONMENT CHECK ===");
console.log(`- SUPABASE_URL: ${SUPABASE_URL ? (isValidSupabaseUrl(SUPABASE_URL) ? "Defined & Valid" : `Invalid ("${SUPABASE_URL}")`) : "Undefined"}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? "Defined (Present)" : "Undefined (Missing)"}`);
console.log(`- SUPABASE_STORAGE_BUCKET: ${SUPABASE_STORAGE_BUCKET ? `Defined ("${SUPABASE_STORAGE_BUCKET}")` : "Undefined"}`);
console.log(`- SUPABASE_ANON_KEY (frontend use only): ${SUPABASE_ANON_KEY ? "Defined" : "Undefined"}`);

if (supabaseClient) {
  console.log(`[Supabase Server Client] Successfully initialized using Service Role Key.`);
} else {
  console.warn(`[Supabase Server Client] Warning: Client not initialized or invalid credentials. Backend uploads will be unavailable.`);
}
console.log("=========================================");

// --- DATABASE CIRCUIT BREAKER ---
let isDbHealthy = isDbConfigured; // Initialize as healthy if configured to avoid startup locks
let lastDbCheckTime = Date.now();
const HEALTH_CHECK_COOLDOWN = 15000; // 15 seconds
let isProbing = false;
let isSettingUpDb = false;

if (pool) {
  const originalQuery = pool.query.bind(pool);
  
  // Helper to race query with timeout to prevent hanging connections
  const queryWithTimeout = (args: any[], ms = 15000) => {
    let timerId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error("Database query timeout (circuit breaker limit reached)"));
      }, ms);
    });
    
    try {
      const executionPromise = originalQuery(...args);
      return Promise.race([executionPromise, timeoutPromise]).finally(() => {
        clearTimeout(timerId);
      });
    } catch (err) {
      clearTimeout(timerId);
      return Promise.reject(err);
    }
  };

  pool.query = async function (this: any, ...args: any[]) {
    const now = Date.now();
    
    // If database is marked unhealthy, use a fast timeout (2.5 seconds) to probe on-the-fly.
    // This prevents server hangs while allowing automatic instant recovery when database is restored.
    const timeoutVal = isSettingUpDb ? 45000 : (isDbHealthy ? 15000 : 2500);
    
    try {
      const result = await queryWithTimeout(args, timeoutVal);
      if (!isDbHealthy) {
        isDbHealthy = true;
        console.log("[Circuit Breaker] Database connection successfully restored!");
      }
      return result;
    } catch (err: any) {
      const errMsg = err.message || "";
      if (
        errMsg.includes("timeout") ||
        errMsg.includes("terminated") ||
        errMsg.includes("Connection") ||
        errMsg.includes("connect") ||
        errMsg.includes("ECONNREFUSED") ||
        errMsg.includes("ENOTFOUND") ||
        errMsg.includes("handshake") ||
        errMsg.includes("pool")
      ) {
        if (isDbHealthy) {
          isDbHealthy = false;
          lastDbCheckTime = now;
          console.log("[Circuit Breaker] Database connection is not available. Defaulting to local memory buffer. Details:", errMsg);
        }
      }
      throw err;
    }
  } as any;

  // Run initial fast probe in a non-blocking background thread
  if (isDbConfigured) {
    console.log("[Circuit Breaker] Running initial database health check...");
    queryWithTimeout(["SELECT 1 as test"], 8000)
      .then(() => {
        isDbHealthy = true;
        console.log("[Circuit Breaker] Initial database health check passed.");
        
        console.log("Database connection healthy. Initiating automatic tables setup...");
        setupAndSeedDatabase()
          .then(() => {
            console.log("Database tables initialized and verified successfully.");
          })
          .catch((dbErr: any) => {
            console.log("Could not automatically initialize database. Using local memory buffer. Details:", dbErr.message);
          });
      })
      .catch((err) => {
        console.log("[Circuit Breaker] Initial database health check: database is offline. Defaulting to local memory buffer. Details:", err.message);
        isDbHealthy = false;
        lastDbCheckTime = Date.now();
      });
  }
}

async function setupAndSeedDatabase() {
  isSettingUpDb = true;
  try {
    if (!isDbConfigured) {
      throw new Error("Database URL is not configured.");
    }

  console.log("Ensuring database tables exist...");

  // Create tables raw SQL
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      mobile VARCHAR(50) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Add additional columns to users if missing
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_address TEXT;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS zip VARCHAR(20);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences TEXT;");
  } catch (userColErr: any) {
    console.warn("Could not alter users table columns:", userColErr.message);
  }

  // Create orders table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      order_date TIMESTAMP DEFAULT NOW(),
      status VARCHAR(50) DEFAULT 'Processing',
      items JSONB NOT NULL,
      total_amount NUMERIC(10, 2) NOT NULL,
      shipping_address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      zip VARCHAR(20),
      country VARCHAR(100),
      payment_method VARCHAR(50) DEFAULT 'UPI',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Alter orders table to add Razorpay payment columns if missing
  try {
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending';");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_time TIMESTAMP;");
  } catch (orderColErr: any) {
    console.warn("Could not alter orders table to add Razorpay columns:", orderColErr.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      original_price NUMERIC(10, 2),
      image TEXT,
      is_best_seller BOOLEAN DEFAULT FALSE,
      stock INTEGER DEFAULT 0,
      sizes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Run migration block to ensure existing databases get the 'sizes' column
  try {
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT;`);
    console.log("Successfully ran ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT;");
  } catch (alterErr: any) {
    console.warn("Could not alter products table to add 'sizes' column, it might already exist or be restricted:", alterErr.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      size VARCHAR(50) DEFAULT '6ml',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  try {
    await pool.query(`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS size VARCHAR(50) DEFAULT '6ml';`);
    console.log("Successfully ran ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);");
  } catch (alterErr: any) {
    console.warn("Could not alter cart_items table to add 'size' column:", alterErr.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_info (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      name VARCHAR(255) NOT NULL,
      tagline VARCHAR(255),
      established INTEGER,
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(100),
      instagram VARCHAR(100),
      owner VARCHAR(100),
      rating VARCHAR(50),
      years_in_business VARCHAR(50),
      happy_customers VARCHAR(50),
      total_products VARCHAR(50),
      hours_weekdays VARCHAR(100),
      hours_sunday VARCHAR(100)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      image TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      rating INTEGER DEFAULT 5,
      text TEXT NOT NULL,
      author VARCHAR(255) NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS faqs (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      instagram_url TEXT,
      sort_order INTEGER DEFAULT 0,
      section VARCHAR(50) DEFAULT 'gallery'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS home_page_images (
      id SERIAL PRIMARY KEY,
      image_key VARCHAR(255) NOT NULL UNIQUE,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS about_page_images (
      id SERIAL PRIMARY KEY,
      image_key VARCHAR(255) NOT NULL UNIQUE,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS services_page_images (
      id SERIAL PRIMARY KEY,
      image_key VARCHAR(255) NOT NULL UNIQUE,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products_page_images (
      id SERIAL PRIMARY KEY,
      image_key VARCHAR(255) NOT NULL UNIQUE,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_page_images (
      id SERIAL PRIMARY KEY,
      image_key VARCHAR(255) NOT NULL UNIQUE,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      inquiry_type VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Migrate existing column types to TEXT to support longer Base64 data URIs
  try {
    console.log("Migrating column types to TEXT for larger payload support...");
    await pool.query("ALTER TABLE products ALTER COLUMN image TYPE TEXT;");
    await pool.query("ALTER TABLE categories ALTER COLUMN image TYPE TEXT;");
    await pool.query("ALTER TABLE gallery_images ALTER COLUMN image_url TYPE TEXT;");
    await pool.query("ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS instagram_url TEXT;");
    await pool.query("ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;");
    await pool.query("ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS section VARCHAR(50) DEFAULT 'gallery';");
    await pool.query("UPDATE gallery_images SET section = 'gallery' WHERE section IS NULL;");
  } catch (migrationErr: any) {
    console.warn("Could not alter initial table column types:", migrationErr.message);
  }

  console.log("Tables creation completed. Running seeding check...");

  let seededProducts = 0;

  // 1. Products Seeding
  console.log(`Checking and seeding database with default products...`);
  for (const p of staticProducts) {
    const parsedId = p.id ? parseInt(String(p.id).replace(/[^\d]/g, ""), 10) : undefined;
    const pid = isNaN(parsedId as any) ? undefined : parsedId;
    const desc = `${p.name} is a premium fragrance in our luxury ${p.category} range.`;
    
    await pool.query(
      `INSERT INTO products (id, name, category, description, price, original_price, image, is_best_seller, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        pid,
        p.name,
        p.category,
        desc,
        p.price,
        (p as any).originalPrice || null,
        p.image,
        p.isBestSeller || false,
        100
      ]
    );
    seededProducts++;
  }

  // 2. Business Info Seeding
  const bizCountRes = await pool.query("SELECT COUNT(*) FROM business_info");
  if (parseInt(bizCountRes.rows[0].count, 10) === 0) {
    console.log("Seeding business info table...");
    await pool.query(
      `INSERT INTO business_info (id, name, tagline, established, address, phone, email, instagram, owner, rating, years_in_business, happy_customers, total_products, hours_weekdays, hours_sunday)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO NOTHING`,
      [
        staticBusinessInfo.name,
        staticBusinessInfo.tagline,
        staticBusinessInfo.established,
        staticBusinessInfo.address,
        staticBusinessInfo.phone,
        staticBusinessInfo.email,
        staticBusinessInfo.instagram,
        staticBusinessInfo.owner,
        staticBusinessInfo.rating,
        staticBusinessInfo.yearsInBusiness,
        staticBusinessInfo.happyCustomers,
        staticBusinessInfo.totalProducts,
        staticBusinessInfo.hours.weekdays,
        staticBusinessInfo.hours.sunday
      ]
    );
  } else {
    // Automatically migrate/update if it was seeded with the default placeholder "My Scent Boutique"
    const currentBizRes = await pool.query("SELECT name FROM business_info WHERE id = 1 LIMIT 1");
    if (currentBizRes.rows.length > 0 && currentBizRes.rows[0].name === "My Scent Boutique") {
      console.log("Updating business name from placeholder 'My Scent Boutique' to 'AHR Perfumes' in DB...");
      await pool.query(
        `UPDATE business_info 
         SET name = $1, tagline = $2, established = $3, address = $4, phone = $5, email = $6, instagram = $7, owner = $8, rating = $9, years_in_business = $10, happy_customers = $11, total_products = $12, hours_weekdays = $13, hours_sunday = $14
         WHERE id = 1`,
        [
          staticBusinessInfo.name,
          staticBusinessInfo.tagline,
          staticBusinessInfo.established,
          staticBusinessInfo.address,
          staticBusinessInfo.phone,
          staticBusinessInfo.email,
          staticBusinessInfo.instagram,
          staticBusinessInfo.owner,
          staticBusinessInfo.rating,
          staticBusinessInfo.yearsInBusiness,
          staticBusinessInfo.happyCustomers,
          staticBusinessInfo.totalProducts,
          staticBusinessInfo.hours.weekdays,
          staticBusinessInfo.hours.sunday
        ]
      );
    }
  }

  // 3. Categories Seeding (Bypassed to respect CMS control over empty categories)
  // Categories are managed purely via CMS settings to avoid unexpected creation or deletion of category groups.

  // 4. Testimonials Seeding
  const testCountRes = await pool.query("SELECT COUNT(*) FROM testimonials");
  if (parseInt(testCountRes.rows[0].count, 10) === 0) {
    console.log("Seeding testimonials table...");
    for (const t of staticTestimonials) {
      await pool.query(
        `INSERT INTO testimonials (rating, text, author)
         VALUES ($1, $2, $3)`,
        [t.rating, t.text, t.author]
      );
    }
  }

  // 5. FAQs Seeding
  const faqCountRes = await pool.query("SELECT COUNT(*) FROM faqs");
  if (parseInt(faqCountRes.rows[0].count, 10) === 0) {
    console.log("Seeding faqs table...");
    for (const f of staticFaqs) {
      await pool.query(
        `INSERT INTO faqs (question, answer)
         VALUES ($1, $2)`,
        [f.question, f.answer]
      );
    }
  }

  // 6. Gallery Images Seeding
  // Seeding bypassed to respect CMS control over empty gallery.
  console.log("Gallery images seeding bypassed to keep gallery clean and clear.");

  // 7. Ensure products table columns for advanced features exist
  if (isDbConfigured) {
    try {
      console.log("Adding additional columns to products if missing...");
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;");
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';");
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';");
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS brochure_url TEXT;");
      await pool.query("ALTER TABLE products ALTER COLUMN brochure_url TYPE TEXT;");
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);");
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;");
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';");
    } catch (colErr: any) {
      console.warn("Could not alter products table columns:", colErr.message);
    }
  }

  // 8. Create and Seed website_content table
  if (isDbConfigured) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS website_content (
          key VARCHAR(255) PRIMARY KEY,
          value JSONB NOT NULL
        );
      `);

      const contentCountRes = await pool.query("SELECT COUNT(*) FROM website_content");
      if (parseInt(contentCountRes.rows[0].count, 10) === 0) {
        console.log("Seeding default website content...");
        
        const defaultHomepage = {
          heroHeading: "Premium Attars Crafted With Tradition",
          heroSubheading: "A.H.R Perfumes",
          heroButtonText: "Explore Collection",
          heroImages: [
            "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2500&auto=format&fit=crop"
          ],
          aboutSection: "A.H.R Perfumes is Indore's premier luxury fragrance destination. Founded on the heritage of rich, pure fragrance crafting, we provide a sophisticated collection of traditional attars, luxury modern perfumes, authentic bakhoor, and customized gifting options.",
          missionVision: "To preserve and promote the traditional art of natural attar blending while curating modern, long-lasting luxury scents for fragrance enthusiasts worldwide. We envision A.H.R Perfumes as a global brand trusted for pure ingredients, unmatched performance, and heritage craftsmanship.",
          services: [
            { "title": "Premium Attars", "description": "Authentic traditional concentrated oils.", "icon": "Droplet" },
            { "title": "Luxury Perfumes", "description": "Modern premium long-lasting sprays.", "icon": "Sparkles" },
            { "title": "Wholesale Supply", "description": "Bulk fragrance solutions for retail.", "icon": "Package" },
            { "title": "Expert Guidance", "description": "Personalized scent recommendations.", "icon": "UserCheck" }
          ],
          testimonials: [
            { "id": 1, "rating": 5, "text": "Excellent perfumes and genuine attars. Best prices in Indore. Highly recommend their Oud collection.", "author": "Mohammed F." },
            { "id": 2, "rating": 5, "text": "The lasting power of their attars is incredible. True luxury experience every time I visit the store.", "author": "Sara K." },
            { "id": 3, "rating": 5, "text": "Ordered a custom gift set for a wedding. The packaging and fragrance quality exceeded expectations.", "author": "Rahul S." }
          ],
          clientLogos: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80",
            "https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=200&q=80",
            "https://images.unsplash.com/photo-1618004835415-6bcb08aa1a7c?w=200&q=80"
          ],
          contactInfo: {
            address: "147 Jawahar Marg, Near Minara Masjid, Bombay Bazar, Indore, Madhya Pradesh 452002",
            phone: "+91 99261 80003",
            email: "contact@ahrperfumes.com",
            instagram: "@a.h.r.perfumes_"
          },
          footerContent: {
            description: "Where Every Scent Tells a Story. Discover our rich collection of artisanal attars and masterfully crafted perfumes since 2007.",
            copyright: "© 2026 A.H.R Perfumes. All Rights Reserved."
          }
        };

        const defaultPageImages = {
          home: {
            hero_banner: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop",
            services_section: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=1000&auto=format&fit=crop",
            about_preview: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop",
            testimonials: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=1000&auto=format&fit=crop",
            clients: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
            footer: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=1000&auto=format&fit=crop"
          },
          about: {
            banner: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200",
            company_images: [
              "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000",
              "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=1000"
            ],
            team_images: [
              "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500",
              "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500"
            ]
          },
          services: {
            service_banners: [
              "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=1000"
            ],
            service_icons: [
              "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=300"
            ],
            gallery: [
              "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
              "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=800",
              "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800"
            ]
          },
          products: {
            product_banners: [
              "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200"
            ],
            product_images: [
              "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800"
            ]
          },
          contact: {
            banner: "https://images.unsplash.com/photo-1620021665476-805fd843e987?q=80&w=1200",
            office_images: [
              "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600"
            ],
            map_image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600"
          }
        };

        await pool.query(
          "INSERT INTO website_content (key, value) VALUES ($1, $2), ($3, $4)",
          ["homepage", JSON.stringify(defaultHomepage), "page_images", JSON.stringify(defaultPageImages)]
        );
        console.log("Successfully seeded website_content.");

        // Seed home_page_images
        for (const [imgKey, val] of Object.entries(defaultPageImages.home)) {
          await pool.query(
            "INSERT INTO home_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO NOTHING",
            [imgKey, val]
          );
        }

        // Seed about_page_images
        for (const [imgKey, val] of Object.entries(defaultPageImages.about)) {
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
              await pool.query(
                "INSERT INTO about_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO NOTHING",
                [`${imgKey}_${i}`, val[i]]
              );
            }
          } else {
            await pool.query(
              "INSERT INTO about_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO NOTHING",
              [imgKey, val]
            );
          }
        }

        // Seed services_page_images
        for (const [imgKey, val] of Object.entries(defaultPageImages.services)) {
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
              await pool.query(
                "INSERT INTO services_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO NOTHING",
                [`${imgKey}_${i}`, val[i]]
              );
            }
          } else {
            await pool.query(
              "INSERT INTO services_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO NOTHING",
              [imgKey, val]
            );
          }
        }

        // Seed products_page_images
        for (const [imgKey, val] of Object.entries(defaultPageImages.products)) {
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
              await pool.query(
                "INSERT INTO products_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO NOTHING",
                [`${imgKey}_${i}`, val[i]]
              );
            }
          } else {
            await pool.query(
              "INSERT INTO products_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO NOTHING",
              [imgKey, val]
            );
          }
        }

        // Seed contact_page_images
        for (const [imgKey, val] of Object.entries(defaultPageImages.contact)) {
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
              await pool.query(
                "INSERT INTO contact_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO NOTHING",
                [`${imgKey}_${i}`, val[i]]
              );
            }
          } else {
            await pool.query(
              "INSERT INTO contact_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO NOTHING",
              [imgKey, val]
            );
          }
        }
        console.log("Successfully seeded page-by-page separate image tables.");
      }
    } catch (contentErr: any) {
      console.warn("Could not build/seed website_content table:", contentErr.message);
    }
  }

  // Synchronize products SERIAL ID sequence to prevent duplicate key constraint violations when adding products
  try {
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('products', 'id'), 
        COALESCE((SELECT MAX(id) FROM products), 1)
      );
    `);
    console.log("Successfully synchronized products ID sequence with maximum ID.");
  } catch (seqErr: any) {
    console.warn("Failed to synchronize products ID sequence:", seqErr.message);
  }

  console.log("Seeding checks complete!");
    return { success: true, seededProducts };
  } finally {
    isSettingUpDb = false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

   app.use(express.json({ limit: "200mb" }));
  app.use(express.urlencoded({ limit: "200mb", extended: true }));

  // API ROUTES
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // In-memory fallback stores
  let activeProducts: any[] = [...staticProducts];
  let inMemoryCart: any[] = [];
  let activeCategories: any[] = [];
  let activeGalleryImages: any[] = [];
  let inMemoryUsers: any[] = [];
  let inMemorySessions: Record<string, any> = {};
  let inMemoryOrders: any[] = [];
  let activeInquiries: any[] = [];
  let activeWebsiteContent: Record<string, any> = {
    homepage: {
      heroHeading: "Premium Attars Crafted With Tradition",
      heroSubheading: "A.H.R Perfumes",
      heroButtonText: "Explore Collection",
      heroImages: [
        "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2500&auto=format&fit=crop"
      ],
      aboutSection: "A.H.R Perfumes is Indore's premier luxury fragrance destination. Founded on the heritage of rich, pure fragrance crafting, we provide a sophisticated collection of traditional attars, luxury modern perfumes, authentic bakhoor, and customized gifting options.",
      missionVision: "To preserve and promote the traditional art of natural attar blending while curating modern, long-lasting luxury scents for fragrance enthusiasts worldwide. We envision A.H.R Perfumes as a global brand trusted for pure ingredients, unmatched performance, and heritage craftsmanship.",
      services: [
        { "title": "Premium Attars", "description": "Authentic traditional concentrated oils.", "icon": "Droplet" },
        { "title": "Luxury Perfumes", "description": "Modern premium long-lasting sprays.", "icon": "Sparkles" },
        { "title": "Wholesale Supply", "description": "Bulk fragrance solutions for retail.", "icon": "Package" },
        { "title": "Expert Guidance", "description": "Personalized scent recommendations.", "icon": "UserCheck" }
      ],
      testimonials: [
        { "id": 1, "rating": 5, "text": "Excellent perfumes and genuine attars. Best prices in Indore. Highly recommend their Oud collection.", "author": "Mohammed F." },
        { "id": 2, "rating": 5, "text": "The lasting power of their attars is incredible. True luxury experience every time I visit the store.", "author": "Sara K." },
        { "id": 3, "rating": 5, "text": "Ordered a custom gift set for a wedding. The packaging and fragrance quality exceeded expectations.", "author": "Rahul S." }
      ],
      clientLogos: [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80",
        "https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=200&q=80",
        "https://images.unsplash.com/photo-1618004835415-6bcb08aa1a7c?w=200&q=80"
      ],
      contactInfo: {
        address: "147 Jawahar Marg, Near Minara Masjid, Bombay Bazar, Indore, Madhya Pradesh 452002",
        phone: "+91 99261 80003",
        email: "contact@ahrperfumes.com",
        instagram: "@a.h.r.perfumes_"
      },
      footerContent: {
        description: "Where Every Scent Tells a Story. Discover our rich collection of artisanal attars and masterfully crafted perfumes since 2007.",
        copyright: "© 2026 A.H.R Perfumes. All Rights Reserved."
      }
    },
    page_images: {
      home: {
        hero_banner: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop",
        services_section: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=1000&auto=format&fit=crop",
        about_preview: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop",
        testimonials: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=1000&auto=format&fit=crop",
        clients: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
        footer: "https://images.unsplash.com/photo-158840574880-12d1d2a59f75?q=80&w=1000&auto=format&fit=crop"
      },
      about: {
        banner: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200",
        company_images: [
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000",
          "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=1000"
        ],
        team_images: [
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500",
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500"
        ]
      },
      services: {
        service_banners: [
          "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=1000"
        ],
        service_icons: [
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=300"
        ],
        gallery: [
          "https://images.unsplash.com/photo-158840574880-12d1d2a59f75?q=80&w=800",
          "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=800",
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800"
        ]
      },
      products: {
        product_banners: [
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200"
        ],
        product_images: [
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800"
        ]
      },
      contact: {
        banner: "https://images.unsplash.com/photo-1620021665476-805fd843e987?q=80&w=1200",
        office_images: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600"
        ],
        map_image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600"
      }
    },
    website_sections: {}
  };

  const FALLBACK_STORE_PATH = path.join(process.cwd(), "db_fallback_store.json");

  async function loadFallbackData() {
    try {
      if (supabaseClient) {
        console.log("[Fallback Store] Checking for backup in Supabase Storage...");
        try {
          // Ensure bucket exists
          try {
            await supabaseClient.storage.createBucket(SUPABASE_STORAGE_BUCKET, { public: true });
          } catch (bucketErr: any) {
            handleSupabaseError(bucketErr);
          }

          if (supabaseClient) {
            const { data, error } = await supabaseClient.storage
              .from(SUPABASE_STORAGE_BUCKET)
              .download("db_fallback_store.png");

            if (error) {
              console.log("[Fallback Store] No backup found or error downloading from Supabase Storage:", error.message);
              handleSupabaseError(error);
            } else if (data) {
              const text = await data.text();
              fs.writeFileSync(FALLBACK_STORE_PATH, text, "utf8");
              console.log("[Fallback Store] Successfully downloaded and cached backup from Supabase Storage.");
            }
          }
        } catch (supabaseErr: any) {
          console.error("[Fallback Store] Failed to download backup from Supabase Storage:", supabaseErr.message || supabaseErr);
          handleSupabaseError(supabaseErr);
        }
      }

      if (fs.existsSync(FALLBACK_STORE_PATH)) {
        const raw = fs.readFileSync(FALLBACK_STORE_PATH, "utf8");
        try {
          const parsed = JSON.parse(raw);
          if (parsed.activeProducts && parsed.activeProducts.length > 0) {
            activeProducts = parsed.activeProducts;
          } else {
            activeProducts = [...staticProducts];
          }
          if (parsed.inMemoryCart) {
            inMemoryCart.length = 0;
            inMemoryCart.push(...parsed.inMemoryCart);
          }
          if (parsed.activeCategories && parsed.activeCategories.length > 0) {
            activeCategories = parsed.activeCategories;
          } else {
            activeCategories = [...staticCategories];
          }
          if (parsed.activeGalleryImages && parsed.activeGalleryImages.length > 0) {
            activeGalleryImages = parsed.activeGalleryImages;
          } else {
            activeGalleryImages = [...staticGalleryImages];
          }
          if (parsed.activeWebsiteContent) activeWebsiteContent = parsed.activeWebsiteContent;
          if (parsed.inMemoryUsers) {
            inMemoryUsers.length = 0;
            inMemoryUsers.push(...parsed.inMemoryUsers);
          }
          if (parsed.inMemorySessions) {
            inMemorySessions = parsed.inMemorySessions;
          }
          if (parsed.inMemoryOrders) {
            inMemoryOrders.length = 0;
            inMemoryOrders.push(...parsed.inMemoryOrders);
          }
          if (parsed.activeInquiries) {
            activeInquiries.length = 0;
            activeInquiries.push(...parsed.activeInquiries);
          }
          console.log("[Fallback Store] Loaded persistent fallback data from disk cache.");
        } catch (parseErr: any) {
          console.error("[Fallback Store] Corrupted fallback data detected. Resetting store to avoid crash and log spam. Error:", parseErr.message);
          try {
            const backupPath = `${FALLBACK_STORE_PATH}.corrupted`;
            if (fs.existsSync(FALLBACK_STORE_PATH)) {
              fs.renameSync(FALLBACK_STORE_PATH, backupPath);
              console.log(`[Fallback Store] Renamed corrupted fallback store to ${backupPath}`);
            }
          } catch (renameErr: any) {
            console.error("[Fallback Store] Failed to rename corrupted file:", renameErr.message);
          }
          await saveFallbackData();
        }
      }
    } catch (err: any) {
      console.warn("[Fallback Store] Failed to load persistent fallback data:", err.message);
    }
  }

  async function saveFallbackData() {
    try {
      const data = {
        activeProducts,
        inMemoryCart,
        activeCategories,
        activeGalleryImages,
        activeWebsiteContent,
        inMemoryUsers,
        inMemorySessions,
        inMemoryOrders,
        activeInquiries
      };
      const jsonString = JSON.stringify(data, null, 2);
      fs.writeFileSync(FALLBACK_STORE_PATH, jsonString, "utf8");
      console.log("[Fallback Store] Saved persistent fallback data to disk.");

      if (supabaseClient) {
        console.log("[Fallback Store] Syncing backup to Supabase Storage...");
        // Upload backup asynchronously in background
        supabaseClient.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .upload("db_fallback_store.png", Buffer.from(jsonString, "utf8"), {
            contentType: "image/png",
            upsert: true
          })
          .then(({ data: uploadData, error: uploadErr }) => {
            if (uploadErr) {
              console.error("[Fallback Store] Failed to sync backup to Supabase Storage:", uploadErr.message);
              handleSupabaseError(uploadErr);
            } else {
              console.log("[Fallback Store] Successfully synced backup to Supabase Storage.");
            }
          })
          .catch((err: any) => {
            console.error("[Fallback Store] Exception syncing backup to Supabase Storage:", err);
            handleSupabaseError(err);
          });
      }
    } catch (err: any) {
      console.warn("[Fallback Store] Failed to save persistent fallback data:", err.message);
    }
  }

  // Load immediately on startup
  await loadFallbackData();

  // --- DATABASE STATUS & SETUP API ---
  app.get("/api/db/status", async (req, res) => {
    try {
      let isConnected = false;
      let errorMsg = null;

      if (isDbConfigured) {
        try {
          const result = await pool.query("SELECT 1 as test");
          if (result && result.rows.length > 0) {
            isConnected = true;
          }
        } catch (e: any) {
          errorMsg = e.message;
        }
      }

      // Mask password in database string
      let maskedConnStr = "Not Configured";
      const connStr = process.env.DATABASE_URL;
      if (connStr) {
        try {
          const url = new URL(connStr);
          url.password = "••••••••";
          maskedConnStr = url.toString();
        } catch (e) {
          maskedConnStr = connStr.replace(/:([^:@]+)@/, ":••••••••@");
        }
      }

      res.json({
        isConfigured: isDbConfigured,
        connectionString: maskedConnStr,
        isConnected,
        error: errorMsg,
        supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
        supabaseUrl: process.env.VITE_SUPABASE_URL || "Not Configured"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/setup", async (req, res) => {
    try {
      if (!isDbConfigured) {
        return res.status(400).json({ 
          error: "DATABASE_URL environment variable is missing or empty. Please set it in your secrets." 
        });
      }

      // Temporarily restore healthy flag to force connection attempt
      isDbHealthy = true;

      // Handle raw SQL queries from the developer console
      if (req.body && req.body.raw_sql) {
        console.log("Executing raw SQL query from console:", req.body.raw_sql);
        const sqlResult = await pool.query(req.body.raw_sql);
        return res.json({
          success: true,
          message: "SQL instruction executed successfully.",
          rows: sqlResult.rows,
          command: sqlResult.command,
          rowCount: sqlResult.rowCount
        });
      }

      const result = await setupAndSeedDatabase();
      const countRes = await pool.query("SELECT COUNT(*) FROM products");
      const count = parseInt(countRes.rows[0].count, 10);

      res.json({
        success: true,
        message: `Database setup successfully. All tables created and initial products and collections seeded.`,
        currentProductCount: count
      });
    } catch (error: any) {
      isDbHealthy = false;
      console.warn("Failed to execute SQL query or setup database:", error.message || error);
      res.status(500).json({ error: "Failed to execute database instruction", details: error.message });
    }
  });

  app.get("/api/debug-db", (req, res) => {
    res.json({
      isDbConfigured,
      isDbHealthy,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  });

  function mapDbProductToClient(dbProd: any) {
    if (!dbProd) return dbProd;
    return {
      ...dbProd,
      originalPrice: dbProd.original_price,
      isBestSeller: dbProd.is_best_seller,
      createdAt: dbProd.created_at,
      updatedAt: dbProd.updated_at,
      isVisible: dbProd.is_visible,
      brochureUrl: dbProd.brochure_url,
      seoTitle: dbProd.seo_title,
      seoDescription: dbProd.seo_description,
    };
  }

  // --- PRODUCTS API ---
  app.get("/api/products", async (req, res) => {
    try {
      if (isDbConfigured && isDbHealthy) {
        const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
        const clientProducts = result.rows.map(mapDbProductToClient);
        // Sync to fallback memory and disk backup
        activeProducts = clientProducts;
        saveFallbackData();
        return res.json(clientProducts);
      }
      res.json(activeProducts);
    } catch (error: any) {
      console.log("Products DB query offline, utilizing memory fallback:", error.message || error);
      res.json(activeProducts);
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      let productIdStr = String(req.params.id).trim();
      if (productIdStr.startsWith('slide_')) {
        productIdStr = productIdStr.replace('slide_', '');
      }
      
      // Try to find in DB first (by ID)
      if (isDbConfigured && isDbHealthy) {
        const cleanIdStr = productIdStr.toLowerCase().startsWith('p') ? productIdStr.slice(1) : productIdStr;
        const productId = parseInt(cleanIdStr, 10);
        if (!isNaN(productId)) {
          const result = await pool.query("SELECT * FROM products WHERE id = $1 LIMIT 1", [productId]);
          if (result.rows.length > 0) {
            return res.json(mapDbProductToClient(result.rows[0]));
          }
        }
        
        // Final fallback within DB: try searching by slugified name matching slugified request parameter
        try {
          const allDbProducts = await pool.query("SELECT * FROM products");
          const dbProd = allDbProducts.rows.find((p: any) => {
            const slugifiedName = String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const slugifiedId = productIdStr.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            return slugifiedName === slugifiedId;
          });
          if (dbProd) {
            return res.json(mapDbProductToClient(dbProd));
          }
        } catch (slugDbErr) {
          console.warn("DB slug fallback query failed:", slugDbErr);
        }
      }
      
      // Try memory fallback (by ID variations)
      const cleanIdStr = productIdStr.toLowerCase().startsWith('p') ? productIdStr.slice(1) : productIdStr;
      const pId = productIdStr.toLowerCase().startsWith('p') ? productIdStr : `p${productIdStr}`;
      let memoryProd = activeProducts.find((p) => 
        String(p.id) === productIdStr || 
        String(p.id) === pId || 
        String(p.id) === cleanIdStr ||
        String(p.id).replace(/[^\d]/g, "") === cleanIdStr
      );
      
      // Final fallback within memory: try searching by slugified name
      if (!memoryProd) {
        memoryProd = activeProducts.find((p) => {
          const slugifiedName = String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          const slugifiedId = productIdStr.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          return slugifiedName === slugifiedId;
        });
      }
      
      if (memoryProd) {
        return res.json(memoryProd);
      }
      res.status(404).json({ error: "Product not found" });
    } catch (error: any) {
      console.log("Product detail DB query offline, utilizing memory fallback:", error.message || error);
      let pIdStr = String(req.params.id).trim();
      if (pIdStr.startsWith('slide_')) {
        pIdStr = pIdStr.replace('slide_', '');
      }
      const cleanIdStr = pIdStr.toLowerCase().startsWith('p') ? pIdStr.slice(1) : pIdStr;
      const pId = pIdStr.toLowerCase().startsWith('p') ? pIdStr : `p${pIdStr}`;
      let memoryProd = activeProducts.find((p) => 
        String(p.id) === pIdStr || 
        String(p.id) === pId || 
        String(p.id) === cleanIdStr ||
        String(p.id).replace(/[^\d]/g, "") === cleanIdStr
      );
      
      if (!memoryProd) {
        memoryProd = activeProducts.find((p) => {
          const slugifiedName = String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          const slugifiedId = pIdStr.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          return slugifiedName === slugifiedId;
        });
      }
      
      if (memoryProd) {
        return res.json(memoryProd);
      }
      res.status(404).json({ error: "Product not found" });
    }
  });

  // --- ADD PRODUCT API (REAL DB & FALLBACK) ---
  app.post("/api/products", async (req, res) => {
    try {
      const { 
        name, category, description, price, originalPrice, image, isBestSeller, stock,
        isVisible, specifications, features, brochureUrl, seoTitle, seoDescription, images, sizes
      } = req.body;
      
      if (!name || !category || !price) {
        return res.status(400).json({ error: "Missing required fields (name, category, price)." });
      }

      const pPrice = parseFloat(price);
      const pOrigPrice = originalPrice ? parseFloat(originalPrice) : null;
      const pStock = stock ? parseInt(stock, 10) : 100;
      const pBest = isBestSeller === true || isBestSeller === "true";
      const pVisible = isVisible !== false && isVisible !== "false";
      
      const pSpecs = typeof specifications === "string" ? JSON.parse(specifications) : (specifications || {});
      const pFeats = typeof features === "string" ? JSON.parse(features) : (features || []);
      const pImages = typeof images === "string" ? JSON.parse(images) : (images || []);
      const pSizes = typeof sizes === "string" ? JSON.parse(sizes) : (sizes || null);
      const pImg = image || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000&auto=format&fit=crop";

      if (isDbConfigured && isDbHealthy) {
        try {
          const insertRes = await pool.query(
            `INSERT INTO products (
              name, category, description, price, original_price, image, is_best_seller, stock,
              is_visible, specifications, features, brochure_url, seo_title, seo_description, images, sizes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
            [
              name, category, description || `${name} premium scent.`, pPrice, pOrigPrice, pImg, pBest, pStock,
              pVisible, JSON.stringify(pSpecs), JSON.stringify(pFeats), brochureUrl || null, seoTitle || null, seoDescription || null, JSON.stringify(pImages),
              pSizes ? JSON.stringify(pSizes) : null
            ]
          );
          return res.status(201).json(mapDbProductToClient(insertRes.rows[0]));
        } catch (dbErr: any) {
          console.error("Database product creation failed, falling back to memory:", dbErr.message);
        }
      }

      // Memory fallback
      const newId = `p${activeProducts.length + 999}`;
      const newProd = {
        id: newId,
        name,
        category,
        description: description || `${name} premium scent.`,
        price: pPrice,
        originalPrice: pOrigPrice,
        image: pImg,
        isBestSeller: pBest,
        stock: pStock,
        rating: 5.0,
        isVisible: pVisible,
        specifications: pSpecs,
        features: pFeats,
        brochureUrl: brochureUrl || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        images: pImages,
        sizes: pSizes
      };
      activeProducts.push(newProd);
      saveFallbackData();
      res.status(201).json(newProd);
    } catch (error: any) {
      console.error("Failed to add product:", error);
      res.status(500).json({ error: "Failed to add product", details: error.message });
    }
  });

  // --- UPDATE PRODUCT API (REAL DB & FALLBACK) ---
  app.put("/api/products/:id", async (req, res) => {
    try {
      const productIdStr = req.params.id;
      const { 
        name, category, description, price, originalPrice, image, isBestSeller, stock,
        isVisible, specifications, features, brochureUrl, seoTitle, seoDescription, images, sizes
      } = req.body;
      
      const pPrice = parseFloat(price);
      const pOrigPrice = originalPrice ? parseFloat(originalPrice) : null;
      const pStock = stock ? parseInt(stock, 10) : 100;
      const pBest = isBestSeller === true || isBestSeller === "true";
      const pVisible = isVisible !== false && isVisible !== "false";
      
      const pSpecs = typeof specifications === "string" ? JSON.parse(specifications) : (specifications || {});
      const pFeats = typeof features === "string" ? JSON.parse(features) : (features || []);
      const pImages = typeof images === "string" ? JSON.parse(images) : (images || []);
      const pSizes = typeof sizes === "string" ? JSON.parse(sizes) : (sizes || null);
      const pImg = image || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000&auto=format&fit=crop";

      if (isDbConfigured && isDbHealthy) {
        const cleanIdStr = productIdStr.startsWith('p') ? productIdStr.slice(1) : productIdStr;
        const productId = parseInt(cleanIdStr, 10);
        if (!isNaN(productId)) {
          try {
            const updateRes = await pool.query(
              `UPDATE products 
               SET name = $1, category = $2, description = $3, price = $4, original_price = $5, image = $6, is_best_seller = $7, stock = $8, is_visible = $9, specifications = $10, features = $11, brochure_url = $12, seo_title = $13, seo_description = $14, images = $15, sizes = $16
               WHERE id = $17 RETURNING *`,
              [
                name, category, description, pPrice, pOrigPrice, pImg, pBest, pStock,
                pVisible, JSON.stringify(pSpecs), JSON.stringify(pFeats), brochureUrl || null, seoTitle || null, seoDescription || null, JSON.stringify(pImages),
                pSizes ? JSON.stringify(pSizes) : null,
                productId
              ]
            );
            if (updateRes.rows.length > 0) {
              return res.json(mapDbProductToClient(updateRes.rows[0]));
            }
          } catch (dbErr: any) {
            console.error("Database product update failed, falling back to memory:", dbErr.message);
          }
        }
      }

      // Memory fallback
      const pId = productIdStr.startsWith('p') ? productIdStr : `p${productIdStr}`;
      const index = activeProducts.findIndex(p => String(p.id) === productIdStr || String(p.id) === pId);
      if (index !== -1) {
        const updated = {
          ...activeProducts[index],
          name,
          category,
          description,
          price: pPrice,
          originalPrice: pOrigPrice,
          image: pImg,
          isBestSeller: pBest,
          stock: pStock,
          isVisible: pVisible,
          specifications: pSpecs,
          features: pFeats,
          brochureUrl: brochureUrl || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          images: pImages,
          sizes: pSizes
        };
        activeProducts[index] = updated;
        saveFallbackData();
        return res.json(updated);
      }

      res.status(404).json({ error: "Product not found to update." });
    } catch (error: any) {
      console.error("Failed to update product:", error);
      res.status(500).json({ error: "Failed to update product", details: error.message });
    }
  });

  // --- DELETE PRODUCT API (REAL DB & FALLBACK) ---
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const productIdStr = req.params.id;
      if (isDbConfigured && isDbHealthy) {
        const cleanIdStr = productIdStr.startsWith('p') ? productIdStr.slice(1) : productIdStr;
        const productId = parseInt(cleanIdStr, 10);
        if (!isNaN(productId)) {
          try {
            await pool.query("DELETE FROM products WHERE id = $1", [productId]);
            return res.json({ success: true, message: `Product ${productId} deleted successfully.` });
          } catch (dbErr: any) {
            console.error("Database product deletion failed, falling back to memory:", dbErr.message);
          }
        }
      }

      // Memory fallback
      const pId = productIdStr.startsWith('p') ? productIdStr : `p${productIdStr}`;
      const initialLen = activeProducts.length;
      activeProducts = activeProducts.filter(p => String(p.id) !== productIdStr && String(p.id) !== pId);
      if (activeProducts.length < initialLen) {
        saveFallbackData();
        return res.json({ success: true, message: `Product ${productIdStr} deleted from buffer.` });
      }

      res.status(404).json({ error: "Product not found to delete." });
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      res.status(500).json({ error: "Failed to delete product", details: error.message });
    }
  });

  // --- ADVANCED SAMPLE PRESET SEED ROUTE ---
  app.post("/api/products/seed-preset", async (req, res) => {
    try {
      const { presetName } = req.body;
      
      let itemsToSeed = [];
      if (presetName === "attars") {
        itemsToSeed = [
          {
            name: "Ruh Khus (Vetiver Deluxe)",
            category: "Attars",
            description: "100% natural wild vetiver distilled in traditional copper degs. Deeply earthy and cooling.",
            price: 1800,
            originalPrice: 2200,
            image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=1000&auto=format&fit=crop",
            isBestSeller: true
          },
          {
            name: "Sandalwood Heritage Gold",
            category: "Attars",
            description: "Creamy pure sandalwood oil infused with ancient traditional spices for an exotic wood aroma.",
            price: 2600,
            originalPrice: 3200,
            image: "https://images.unsplash.com/photo-1616805847426-ab238a221f7c?q=80&w=1000&auto=format&fit=crop",
            isBestSeller: true
          },
          {
            name: "Musk Al Kaba",
            category: "Attars",
            description: "A dark spiritual blend of pure black musk oil seasoned with saffron and heavy amber notes.",
            price: 1500,
            originalPrice: 1900,
            image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000&auto=format&fit=crop",
            isBestSeller: false
          },
          {
            name: "Shamama Gold Reserve",
            category: "Attars",
            description: "A complex combination distilled from over 40 secret herbs, roots, spices, and oud.",
            price: 2400,
            originalPrice: 2900,
            image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop",
            isBestSeller: true
          }
        ];
      } else if (presetName === "sprays") {
        itemsToSeed = [
          {
            name: "Noir Extreme Eau De Parfum",
            category: "Perfumes",
            description: "An Amber Woody scent opening with spicy cardamom, sweet kulfi accord, and dark cocoa base.",
            price: 3600,
            originalPrice: 4200,
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop",
            isBestSeller: true
          },
          {
            name: "Amber Oud Grandeur",
            category: "Perfumes",
            description: "Warm majestic French oud layered with light cedarwood, rich patchouli, and honey syrup.",
            price: 4500,
            originalPrice: 5100,
            image: "https://images.unsplash.com/photo-158840574880-12d1d2a59f75?q=80&w=1000&auto=format&fit=crop",
            isBestSeller: true
          },
          {
            name: "Royal Rose Aura",
            category: "Perfumes",
            description: "Soft modern spray of precious Damask rose balanced by Madagascar vanilla bean and iris.",
            price: 3200,
            originalPrice: 3800,
            image: "https://images.unsplash.com/photo-1595532545115-4ba972e382bb?q=80&w=1000&auto=format&fit=crop",
            isBestSeller: false
          },
          {
            name: "Vibrant Marine Aqua",
            category: "Perfumes",
            description: "Fresh sea minerals, cold mint leaves, and light lemon blended with amberwood.",
            price: 2900,
            originalPrice: 3500,
            image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=1000&auto=format&fit=crop",
            isBestSeller: true
          }
        ];
      } else {
        // Complete collection (original data)
        itemsToSeed = staticProducts.map((p: any) => ({
          name: p.name,
          category: p.category,
          description: `${p.name} is a premium luxury fragrance in our ${p.category} range.`,
          price: p.price,
          originalPrice: p.price + 500,
          image: p.image,
          isBestSeller: p.isBestSeller || false
        }));
      }

      if (isDbConfigured && isDbHealthy) {
        // Remove existing products
        await pool.query("DELETE FROM products");
        try {
          await pool.query(`SELECT setval(pg_get_serial_sequence('products', 'id'), 1, false)`);
        } catch (seqErr: any) {
          console.warn("Could not reset products sequence in seed-preset:", seqErr.message);
        }
        
        let inserted = 0;
        for (const item of itemsToSeed) {
          await pool.query(
            `INSERT INTO products (name, category, description, price, original_price, image, is_best_seller, stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              item.name, 
              item.category, 
              item.description, 
              item.price, 
              item.originalPrice || null, 
              item.image, 
              item.isBestSeller, 
              100
            ]
          );
          inserted++;
        }

        try {
          await pool.query(`
            SELECT setval(
              pg_get_serial_sequence('products', 'id'), 
              COALESCE((SELECT MAX(id) FROM products), 1)
            );
          `);
        } catch (seqErr: any) {
          console.warn("Could not synchronize products sequence in seed-preset:", seqErr.message);
        }

        return res.json({ success: true, message: `Successfully seeded preset '${presetName}' (${inserted} items) in the PostgreSQL database.` });
      }

      // Memory fallback seeding
      activeProducts = itemsToSeed.map((item, index) => ({
        id: `p${index + 100}`,
        name: item.name,
        category: item.category,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        isBestSeller: item.isBestSeller,
        stock: 100,
        rating: 4.8
      }));
      saveFallbackData();

      res.json({ success: true, message: `Successfully seeded preset '${presetName}' (${activeProducts.length} items) in mock RAM buffer.` });
    } catch (err: any) {
      console.error("Failed to seed preset:", err);
      res.status(500).json({ error: "Failed to seed preset schema", details: err.message });
    }
  });

  // --- AUTHENTICATION & SECURE SESSION API ---
  const getAuthenticatedUser = async (req: express.Request) => {
    let token = req.headers["x-session-token"] as string;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) return null;

    const session = inMemorySessions[token];
    if (session) {
      if (session.expiresAt && Date.now() > session.expiresAt) {
        delete inMemorySessions[token];
        saveFallbackData();
        return null;
      }
      return session.user;
    }
    return null;
  };

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, mobile, password, name } = req.body;

      if (!email || !mobile || !password) {
        return res.status(400).json({ error: "Email, Mobile Number, and Password are required." });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }

      if (mobile.trim().length < 8) {
        return res.status(400).json({ error: "Please enter a valid mobile number (at least 8 digits)." });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      const pHash = hashPassword(password);
      const emailLower = email.trim().toLowerCase();
      const mobileClean = mobile.trim();

      // Check if user already exists
      let existingUser = null;
      if (isDbConfigured && isDbHealthy) {
        try {
          const dbUsers = await db.select().from(users).where(eq(users.email, emailLower)).limit(1);
          if (dbUsers.length > 0) {
            existingUser = dbUsers[0];
          } else {
            const dbUsersMobile = await db.select().from(users).where(eq(users.mobile, mobileClean)).limit(1);
            if (dbUsersMobile.length > 0) {
              existingUser = dbUsersMobile[0];
            }
          }
        } catch (dbErr) {
          console.error("Database user check failed, using fallback:", dbErr);
        }
      }

      if (!existingUser) {
        existingUser = inMemoryUsers.find(
          u => u.email === emailLower || u.mobile === mobileClean
        );
      }

      if (existingUser) {
        return res.status(400).json({ error: "An account with this email or mobile number already exists." });
      }

      // Create new user
      const newUser = {
        email: emailLower,
        mobile: mobileClean,
        passwordHash: pHash,
        name: name ? name.trim() : null,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      let createdUser = null;
      if (isDbConfigured && isDbHealthy) {
        try {
          const inserted = await db.insert(users).values({
            email: newUser.email,
            mobile: newUser.mobile,
            passwordHash: newUser.passwordHash,
            name: newUser.name,
            role: newUser.role
          }).returning();
          createdUser = inserted[0];
        } catch (dbErr: any) {
          console.error("Database user insertion failed, using fallback:", dbErr);
        }
      }

      if (!createdUser) {
        const fallbackId = inMemoryUsers.length + 1000 + Math.floor(Math.random() * 9000);
        const userWithId = { id: fallbackId, ...newUser };
        inMemoryUsers.push(userWithId);
        await saveFallbackData();
        createdUser = userWithId;
      } else {
        inMemoryUsers.push(createdUser);
        await saveFallbackData();
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const sessionData = {
        user: {
          id: String(createdUser.id),
          email: createdUser.email,
          mobile: createdUser.mobile,
          name: createdUser.name,
          role: createdUser.role
        },
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      };

      inMemorySessions[sessionToken] = sessionData;
      await saveFallbackData();

      res.status(201).json({
        success: true,
        sessionToken,
        user: sessionData.user
      });

    } catch (err: any) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "An error occurred during sign up.", details: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ error: "Email or Mobile Number and Password are required." });
      }

      const cleanIdentifier = identifier.trim().toLowerCase();

      // Find user
      let userFound = null;
      if (isDbConfigured && isDbHealthy) {
        try {
          const dbUsers = await db.select().from(users).where(eq(users.email, cleanIdentifier)).limit(1);
          if (dbUsers.length > 0) {
            userFound = dbUsers[0];
          } else {
            const dbUsersMobile = await db.select().from(users).where(eq(users.mobile, identifier.trim())).limit(1);
            if (dbUsersMobile.length > 0) {
              userFound = dbUsersMobile[0];
            }
          }
        } catch (dbErr) {
          console.error("Database user find failed, using fallback:", dbErr);
        }
      }

      if (!userFound) {
        userFound = inMemoryUsers.find(
          u => u.email === cleanIdentifier || u.mobile === identifier.trim()
        );
      }

      if (!userFound) {
        return res.status(400).json({ error: "Invalid credentials. Please check your email/mobile or password." });
      }

      // Verify password
      const isValid = verifyPassword(password, userFound.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid credentials. Please check your email/mobile or password." });
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const sessionData = {
        user: {
          id: String(userFound.id),
          email: userFound.email,
          mobile: userFound.mobile,
          name: userFound.name,
          role: userFound.role
        },
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      };

      inMemorySessions[sessionToken] = sessionData;
      await saveFallbackData();

      res.json({
        success: true,
        sessionToken,
        user: sessionData.user
      });

    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "An error occurred during login.", details: err.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized. Please login again." });
      }
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch user session.", details: err.message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      let token = req.headers["x-session-token"] as string;
      if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(" ");
        if (parts[0] === "Bearer") {
          token = parts[1];
        }
      }

      if (token && inMemorySessions[token]) {
        delete inMemorySessions[token];
        await saveFallbackData();
      }

      res.json({ success: true, message: "Logged out successfully." });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to log out.", details: err.message });
    }
  });

  // --- USER PROFILE & ORDERS API ---
  app.get("/api/user/profile", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized. Please login again." });
      }

      // Fetch fresh details from database if configured and healthy
      let freshUser = authUser;
      if (isDbConfigured && isDbHealthy) {
        try {
          const dbResult = await pool.query("SELECT * FROM users WHERE id = $1", [authUser.id]);
          if (dbResult.rows.length > 0) {
            freshUser = dbResult.rows[0];
            // Format camelCase properties for frontend consistency if needed
            if (freshUser.password_hash) {
              freshUser.passwordHash = freshUser.password_hash;
            }
            if (freshUser.created_at) {
              freshUser.createdAt = freshUser.created_at;
            }
            if (freshUser.updated_at) {
              freshUser.updatedAt = freshUser.updated_at;
            }
          }
        } catch (dbErr) {
          console.warn("Failed to fetch fresh user from database:", dbErr);
        }
      } else {
        const local = inMemoryUsers.find(u => u.id === authUser.id || u.email === authUser.email);
        if (local) {
          freshUser = local;
        }
      }

      res.json({ success: true, user: freshUser });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch profile.", details: err.message });
    }
  });

  app.put("/api/user/profile", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized. Please login again." });
      }

      const { name, mobile, shipping_address, city, state, zip, country, preferences } = req.body;

      if (!mobile) {
        return res.status(400).json({ error: "Mobile number is required." });
      }

      // Update in DB if configured
      let updatedUser = { ...authUser, name, mobile, shipping_address, city, state, zip, country, preferences };
      if (isDbConfigured && isDbHealthy) {
        try {
          const dbResult = await pool.query(
            `UPDATE users SET 
              name = $1, 
              mobile = $2, 
              shipping_address = $3, 
              city = $4, 
              state = $5, 
              zip = $6, 
              country = $7, 
              preferences = $8,
              updated_at = NOW()
             WHERE id = $9 RETURNING *`,
            [name || null, mobile, shipping_address || null, city || null, state || null, zip || null, country || null, preferences || null, authUser.id]
          );
          if (dbResult.rows.length > 0) {
            updatedUser = dbResult.rows[0];
          }
        } catch (dbErr: any) {
          console.error("Failed to update user in DB:", dbErr.message);
          return res.status(500).json({ error: "Database update failed.", details: dbErr.message });
        }
      }

      // Sync inMemoryUsers
      const localIdx = inMemoryUsers.findIndex(u => u.id === authUser.id || u.email === authUser.email);
      if (localIdx !== -1) {
        inMemoryUsers[localIdx] = {
          ...inMemoryUsers[localIdx],
          name,
          mobile,
          shipping_address,
          city,
          state,
          zip,
          country,
          preferences,
          updatedAt: new Date()
        };
      } else {
        inMemoryUsers.push({
          id: authUser.id,
          email: authUser.email,
          name,
          mobile,
          shipping_address,
          city,
          state,
          zip,
          country,
          preferences,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Sync active session token user object
      let token = req.headers["x-session-token"] as string;
      if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(" ");
        if (parts[0] === "Bearer") {
          token = parts[1];
        }
      }
      if (token && inMemorySessions[token]) {
        inMemorySessions[token].user = {
          ...inMemorySessions[token].user,
          name,
          mobile,
          shipping_address,
          city,
          state,
          zip,
          country,
          preferences
        };
      }

      await saveFallbackData();

      res.json({ success: true, message: "Profile updated successfully.", user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update profile.", details: err.message });
    }
  });

  app.get("/api/user/orders", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized. Please login again to view orders." });
      }

      let userOrders = [];
      if (isDbConfigured && isDbHealthy) {
        try {
          const dbResult = await pool.query(
            "SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC",
            [String(authUser.id)]
          );
          userOrders = dbResult.rows;
        } catch (dbErr) {
          console.warn("Failed to fetch orders from database, falling back to local memory:", dbErr);
          userOrders = inMemoryOrders.filter(o => String(o.user_id) === String(authUser.id));
        }
      } else {
        userOrders = inMemoryOrders.filter(o => String(o.user_id) === String(authUser.id));
      }

      // Sort descending by order date
      userOrders.sort((a: any, b: any) => {
        const dateA = new Date(a.order_date || a.createdAt || 0).getTime();
        const dateB = new Date(b.order_date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      res.json({ success: true, orders: userOrders });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch orders.", details: err.message });
    }
  });

  app.post("/api/user/orders", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      const userId = authUser ? String(authUser.id) : (req.body.guestId || "guest_" + Math.random().toString(36).substring(2, 8));

      const { items, total_amount, shipping_address, city, state, zip, country, payment_method } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cannot place order with empty cart." });
      }

      let createdOrder = null;
      if (isDbConfigured && isDbHealthy) {
        try {
          const dbResult = await pool.query(
            `INSERT INTO orders (user_id, items, total_amount, shipping_address, city, state, zip, country, payment_method, status, order_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Processing', NOW()) RETURNING *`,
            [userId, JSON.stringify(items), total_amount, shipping_address || null, city || null, state || null, zip || null, country || null, payment_method || "UPI"]
          );
          if (dbResult.rows.length > 0) {
            createdOrder = dbResult.rows[0];
          }
        } catch (dbErr: any) {
          console.error("Database order insertion failed, falling back to memory:", dbErr.message);
        }
      }

      if (!createdOrder) {
        const fallbackId = inMemoryOrders.length + 10001 + Math.floor(Math.random() * 9000);
        createdOrder = {
          id: fallbackId,
          user_id: userId,
          order_date: new Date(),
          status: 'Processing',
          items,
          total_amount,
          shipping_address,
          city,
          state,
          zip,
          country,
          payment_method,
          created_at: new Date()
        };
        inMemoryOrders.push(createdOrder);
      }

      await saveFallbackData();

      res.json({ success: true, message: "Order placed successfully.", order: createdOrder });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to place order.", details: err.message });
    }
  });

  // --- RAZORPAY PAYMENT GATEWAY API ---
  const VALID_COUPONS: Record<string, { discountPercent: number }> = {
    "AHR10": { discountPercent: 10 },
    "WELCOME5": { discountPercent: 5 },
    "PREMIUM20": { discountPercent: 20 },
  };

  let razorpayClient: any = null;
  const getRazorpayClient = () => {
    if (!razorpayClient) {
      const keyId = cleanEnvVar(process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID);
      const keySecret = cleanEnvVar(process.env.RAZORPAY_KEY_SECRET);
      razorpayClient = new Razorpay({
        key_id: keyId || "rzp_test_placeholder_key",
        key_secret: keySecret || "placeholder_secret"
      });
    }
    return razorpayClient;
  };

  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      // 1. Customer authentication validation
      const authUser = await getAuthenticatedUser(req);
      if (!authUser) {
        return res.status(401).json({ error: "Customer authentication is required. Please log in first." });
      }

      const { items, coupon, shipping_address, city, state, zip, country } = req.body;

      // 2. Cart is not empty validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cart is empty." });
      }

      // 3. Delivery address is valid validation
      if (!shipping_address || !city || !state || !zip) {
        return res.status(400).json({ error: "Please enter a valid shipping address, city, state, and pincode." });
      }

      // 4. Products existence, active state, stock check, and price fetching from database
      let subtotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const actualIdStr = String(item.id).split('_')[0];
        const parsedId = parseInt(actualIdStr, 10);
        let dbProd = null;
        if (isDbConfigured && isDbHealthy && !isNaN(parsedId)) {
          try {
            const dbResult = await pool.query("SELECT * FROM products WHERE id = $1", [parsedId]);
            if (dbResult.rows.length > 0) {
              dbProd = dbResult.rows[0];
            }
          } catch (dbErr) {
            console.error("Failed to query product from database:", dbErr);
          }
        }

        if (!dbProd) {
          dbProd = staticProducts.find(p => String(p.id) === String(actualIdStr));
        }

        if (!dbProd) {
          return res.status(400).json({ error: `Product "${item.name}" does not exist.` });
        }

        // Active check: is_visible is true (or undefined/not false)
        if (dbProd.is_visible === false) {
          return res.status(400).json({ error: `Product "${dbProd.name}" is not active.` });
        }

        // Stock validation
        const currentStock = parseInt(dbProd.stock || 0);
        if (currentStock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for product "${dbProd.name}". Only ${currentStock} left in stock.` });
        }

        // Product prices fetched from database / sizes JSON
        let finalItemPrice = Number(dbProd.price);
        if (item.size && item.size !== "Standard") {
          let sizesArray = [];
          if (typeof dbProd.sizes === "string") {
            try {
              sizesArray = JSON.parse(dbProd.sizes);
            } catch (e) {}
          } else if (Array.isArray(dbProd.sizes)) {
            sizesArray = dbProd.sizes;
          }
          const matchedSize = sizesArray.find((s: any) => s.size === item.size);
          if (matchedSize) {
            finalItemPrice = Number(matchedSize.price);
          }
        }

        subtotal += finalItemPrice * item.quantity;
        validatedItems.push({
          ...item,
          price: finalItemPrice
        });
      }

      // 5. Coupon validation (if applied)
      let couponDiscount = 0;
      if (coupon) {
        const normalizedCoupon = String(coupon).trim().toUpperCase();
        const couponData = VALID_COUPONS[normalizedCoupon];
        if (!couponData) {
          return res.status(400).json({ error: "Invalid coupon code." });
        }
        couponDiscount = Math.round((subtotal * couponData.discountPercent) / 100);
      }

      // 6. Final amount calculation (calculated on backend only)
      let finalAmount = subtotal - couponDiscount;
      
      // Calculate 5% prepaid checkout discount as shown on the checkout screen
      const prepaidDiscount = Math.round(finalAmount * 0.05);
      finalAmount -= prepaidDiscount;

      if (finalAmount < 1) {
        finalAmount = 1; // Razorpay requires at least 1 INR
      }

      // Initialize Razorpay Order via SDK
      try {
        const rzp = getRazorpayClient();
        const options = {
          amount: Math.round(finalAmount * 100), // in paise
          currency: "INR",
          receipt: `rcpt_user_${authUser.id}_${Date.now().toString(36)}`,
          notes: {
            userId: String(authUser.id),
            userEmail: authUser.email,
            coupon: coupon || "",
            subtotal: String(subtotal),
            couponDiscount: String(couponDiscount),
            prepaidDiscount: String(prepaidDiscount),
          }
        };

        const order = await rzp.orders.create(options);

        res.json({
          success: true,
          keyId: cleanEnvVar(process.env.VITE_RAZORPAY_KEY_ID) || "rzp_test_placeholder_key",
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          subtotal,
          couponDiscount,
          prepaidDiscount,
          finalAmount,
          items: validatedItems
        });
      } catch (rzpErr: any) {
        console.error("Razorpay API order creation failed:", rzpErr);
        res.status(500).json({ error: "Failed to initialize Razorpay checkout session with payment gateway.", details: rzpErr.message });
      }
    } catch (err: any) {
      console.error("Create order endpoint error:", err);
      res.status(500).json({ error: "Internal server error during order initialization.", details: err.message });
    }
  });

  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      if (!authUser) {
        return res.status(401).json({ error: "Customer authentication is required. Please log in first." });
      }

      const userId = String(authUser.id);
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        items,
        total_amount,
        shipping_address,
        city,
        state,
        zip,
        country,
        payment_method,
        coupon
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required Razorpay payment credentials." });
      }

      // Verify payment signature on backend
      const keySecret = cleanEnvVar(process.env.RAZORPAY_KEY_SECRET) || "placeholder_secret";
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Payment signature verification failed. Transaction was not verified." });
      }

      // Re-verify stock before completing order
      for (const item of items) {
        const actualIdStr = String(item.id).split('_')[0];
        const parsedId = parseInt(actualIdStr, 10);
        let dbProd = null;
        if (isDbConfigured && isDbHealthy && !isNaN(parsedId)) {
          try {
            const dbResult = await pool.query("SELECT stock, name FROM products WHERE id = $1", [parsedId]);
            if (dbResult.rows.length > 0) {
              dbProd = dbResult.rows[0];
            }
          } catch (e) {}
        }
        if (dbProd) {
          const currentStock = parseInt(dbProd.stock || 0);
          if (currentStock < item.quantity) {
            return res.status(400).json({ error: `Product "${dbProd.name}" stock went out during checkout. Payment refunded.` });
          }
        }
      }

      let createdOrder = null;
      const paymentTime = new Date();
      const paymentStatus = "Paid";
      const transactionId = razorpay_payment_id;

      // Update database using SQL Transaction
      if (isDbConfigured && isDbHealthy) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Reduce stock for each product
          for (const item of items) {
            const actualIdStr = String(item.id).split('_')[0];
            const parsedId = parseInt(actualIdStr, 10);
            if (!isNaN(parsedId)) {
              await client.query(
                "UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2",
                [item.quantity, parsedId]
              );
            }
          }

          // Create final order in the database with Razorpay variables
          const dbResult = await client.query(
            `INSERT INTO orders (
              user_id, items, total_amount, shipping_address, city, state, zip, country, payment_method, status, order_date,
              razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_status, transaction_id, payment_time
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Processing', NOW(), $10, $11, $12, $13, $14, $15)
             RETURNING *`,
            [
              userId,
              JSON.stringify(items),
              total_amount,
              shipping_address || null,
              city || null,
              state || null,
              zip || null,
              country || null,
              payment_method || "UPI",
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              paymentStatus,
              transactionId,
              paymentTime
            ]
          );

          if (dbResult.rows.length > 0) {
            createdOrder = dbResult.rows[0];
          }

          await client.query("COMMIT");
        } catch (dbErr: any) {
          await client.query("ROLLBACK");
          console.error("Order completion database transaction error:", dbErr);
          return res.status(500).json({ error: "Failed to process order transaction in database.", details: dbErr.message });
        } finally {
          client.release();
        }
      }

      // Fallback update to local memory if database was bypassed/failed
      if (!createdOrder) {
        const fallbackId = inMemoryOrders.length + 10001 + Math.floor(Math.random() * 9000);
        createdOrder = {
          id: fallbackId,
          user_id: userId,
          order_date: new Date(),
          status: 'Processing',
          items,
          total_amount,
          shipping_address,
          city,
          state,
          zip,
          country,
          payment_method,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          payment_status: paymentStatus,
          transaction_id: transactionId,
          payment_time: paymentTime,
          created_at: new Date()
        };
        inMemoryOrders.push(createdOrder);
        await saveFallbackData();
      }

      res.json({
        success: true,
        message: "Payment successfully verified and order placed.",
        order: createdOrder
      });
    } catch (err: any) {
      console.error("Payment verification endpoint error:", err);
      res.status(500).json({ error: "Internal payment verification failed.", details: err.message });
    }
  });

  // --- CART API ---
  app.get("/api/cart", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      const userId = authUser ? String(authUser.id) : (req.headers['x-user-id'] as string); 
      if (!userId || typeof userId !== 'string') {
        return res.status(401).json({ error: "Unauthorized. Missing session token or guest header." });
      }

      if (isDbConfigured && isDbHealthy) {
        const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
        return res.json(items);
      }

      const userItems = inMemoryCart.filter(item => item.userId === userId);
      res.json(userItems);
    } catch (error: any) {
      console.warn("Error fetching cart items:", error.message || error);
      const authUser = await getAuthenticatedUser(req);
      const userId = authUser ? String(authUser.id) : (req.headers['x-user-id'] as string);
      if (!userId || typeof userId !== 'string') {
        return res.status(401).json({ error: "Unauthorized." });
      }
      const userItems = inMemoryCart.filter(item => item.userId === userId);
      res.json(userItems);
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      const userId = authUser ? String(authUser.id) : (req.headers['x-user-id'] as string); 
      if (!userId || typeof userId !== 'string') {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { productId, quantity } = req.body;
      if (productId === undefined || typeof quantity !== 'number') {
         return res.status(400).json({ error: "Invalid payload" });
      }

      if (isDbConfigured && isDbHealthy) {
        const prodIdStr = String(productId).split('_')[0];
        const parsedProdId = parseInt(prodIdStr, 10);
        const itemSize = String(productId).split('_')[1] || "6ml";

        if (!isNaN(parsedProdId)) {
          const existing = await db.select().from(cartItems)
            .where(and(
              eq(cartItems.userId, userId),
              eq(cartItems.productId, parsedProdId),
              eq(cartItems.size, itemSize)
            ))
            .limit(1);

          if (existing.length > 0) {
            const item = existing[0];
            const updated = await db.update(cartItems)
              .set({ quantity: item.quantity + quantity, updatedAt: new Date() })
              .where(eq(cartItems.id, item.id))
              .returning();
            return res.json(updated[0]);
          } else {
            const inserted = await db.insert(cartItems)
              .values({ userId, productId: parsedProdId, quantity, size: itemSize })
              .returning();
            return res.json(inserted[0]);
          }
        }
      }

      const existingIndex = inMemoryCart.findIndex(
        item => item.userId === userId && String(item.productId) === String(productId)
      );

      if (existingIndex >= 0) {
        inMemoryCart[existingIndex].quantity += quantity;
        inMemoryCart[existingIndex].updatedAt = new Date();
        saveFallbackData();
        res.json(inMemoryCart[existingIndex]);
      } else {
        const newItem = {
          id: inMemoryCart.length + 1,
          userId,
          productId,
          quantity,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        inMemoryCart.push(newItem);
        saveFallbackData();
        res.json(newItem);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ error: "Failed to add item to cart", details: error });
    }
  });

  app.delete("/api/cart/product/:productId", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      const userId = authUser ? String(authUser.id) : (req.headers['x-user-id'] as string); 
      if (!userId || typeof userId !== 'string') {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const prodIdStr = req.params.productId;
      const parsedProdId = parseInt(prodIdStr.split('_')[0], 10);
      const itemSize = prodIdStr.split('_')[1] || "6ml";

      if (isDbConfigured && isDbHealthy) {
        if (!isNaN(parsedProdId)) {
          await db.delete(cartItems).where(and(
            eq(cartItems.userId, userId),
            eq(cartItems.productId, parsedProdId),
            eq(cartItems.size, itemSize)
          ));
          return res.json({ success: true });
        }
      }

      const initialLength = inMemoryCart.length;
      const filtered = inMemoryCart.filter(
        item => !(item.userId === userId && String(item.productId) === String(prodIdStr))
      );
      if (filtered.length !== initialLength) {
        inMemoryCart.length = 0;
        inMemoryCart.push(...filtered);
        saveFallbackData();
        return res.json({ success: true });
      }

      res.status(404).json({ error: "Product not found in cart" });
    } catch (error) {
      console.error("Error removing product from cart:", error);
      res.status(500).json({ error: "Failed to remove product from cart" });
    }
  });

  app.put("/api/cart/product/:productId", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      const userId = authUser ? String(authUser.id) : (req.headers['x-user-id'] as string); 
      if (!userId || typeof userId !== 'string') {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const prodIdStr = req.params.productId;
      const parsedProdId = parseInt(prodIdStr.split('_')[0], 10);
      const itemSize = prodIdStr.split('_')[1] || "6ml";
      const { quantity } = req.body;

      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      if (isDbConfigured && isDbHealthy) {
        if (!isNaN(parsedProdId)) {
          const updated = await db.update(cartItems)
            .set({ quantity, updatedAt: new Date() })
            .where(and(
              eq(cartItems.userId, userId),
              eq(cartItems.productId, parsedProdId),
              eq(cartItems.size, itemSize)
            ))
            .returning();
          return res.json({ success: true, updated: updated[0] });
        }
      }

      const itemIndex = inMemoryCart.findIndex(
        item => item.userId === userId && String(item.productId) === String(prodIdStr)
      );
      if (itemIndex >= 0) {
        inMemoryCart[itemIndex].quantity = quantity;
        inMemoryCart[itemIndex].updatedAt = new Date();
        saveFallbackData();
        return res.json({ success: true, item: inMemoryCart[itemIndex] });
      }

      res.status(404).json({ error: "Product not found in cart" });
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      res.status(500).json({ error: "Failed to update quantity" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const authUser = await getAuthenticatedUser(req);
      const userId = authUser ? String(authUser.id) : (req.headers['x-user-id'] as string); 
      if (!userId || typeof userId !== 'string') {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const cartItemIdStr = req.params.id;

      if (isDbConfigured && isDbHealthy) {
        const cartItemId = parseInt(cartItemIdStr, 10);
        if (!isNaN(cartItemId)) {
          const itemToDelete = await db.select().from(cartItems).where(eq(cartItems.id, cartItemId)).limit(1);
          if (itemToDelete.length > 0 && itemToDelete[0].userId === userId) {
            await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
            return res.json({ success: true });
          }
        }
      }

      const itemIndex = inMemoryCart.findIndex(
        item => String(item.id) === cartItemIdStr && item.userId === userId
      );
      if (itemIndex >= 0) {
        inMemoryCart.splice(itemIndex, 1);
        saveFallbackData();
        return res.json({ success: true });
      }

      res.status(444).json({ error: "Item not found" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: "Failed to remove item" });
    }
  });

  // --- BUSINESS INFO API ---
  app.get("/api/business-info", async (req, res) => {
    try {
      if (isDbConfigured && isDbHealthy) {
        const result = await pool.query("SELECT * FROM business_info WHERE id = 1 LIMIT 1");
        if (result.rows.length > 0) {
          const row = result.rows[0];
          return res.json({
            name: row.name,
            tagline: row.tagline,
            established: row.established,
            address: row.address,
            phone: row.phone,
            email: row.email,
            instagram: row.instagram,
            owner: row.owner,
            rating: row.rating,
            yearsInBusiness: row.years_in_business,
            happyCustomers: row.happy_customers,
            totalProducts: row.total_products,
            hours: {
              weekdays: row.hours_weekdays,
              sunday: row.hours_sunday
            }
          });
        }
      }
      res.json(staticBusinessInfo);
    } catch (error: any) {
      console.log("Business info DB query offline, utilizing memory fallback:", error.message || error);
      res.json(staticBusinessInfo);
    }
  });

  // --- CATEGORIES API ---
  app.get("/api/categories", async (req, res) => {
    try {
      if (isDbConfigured && isDbHealthy) {
        const result = await pool.query("SELECT * FROM categories ORDER BY id ASC");
        
        // If the database has records, dynamically sync database categories to the fallback store
        if (result.rows && result.rows.length > 0) {
          activeCategories = result.rows;
          saveFallbackData();
          return res.json(result.rows);
        } else if (activeCategories && activeCategories.length > 0) {
          // If the database table is empty, but we have categories in our fallback memory
          // (e.g. from a manual seed, or created while the database was recovering/unreachable),
          // sync them into the database so we do not lose user data!
          console.log("[Sync] Categories table in database is empty but local fallback data exists. Syncing fallback categories to database...");
          for (const cat of activeCategories) {
            await pool.query(
              "INSERT INTO categories (title, description, image) VALUES ($1, $2, $3) ON CONFLICT (title) DO NOTHING",
              [cat.title, cat.description || "", cat.image || ""]
            );
          }
          // Re-query to get the official database rows with assigned IDs
          const refreshedResult = await pool.query("SELECT * FROM categories ORDER BY id ASC");
          activeCategories = refreshedResult.rows;
          saveFallbackData();
          return res.json(refreshedResult.rows);
        }
        
        return res.json([]);
      }
      res.json(activeCategories);
    } catch (error: any) {
      console.log("Categories DB query offline, utilizing memory fallback:", error.message || error);
      res.json(activeCategories);
    }
  });

  // --- TESTIMONIALS API ---
  app.get("/api/testimonials", async (req, res) => {
    try {
      if (isDbConfigured && isDbHealthy) {
        const result = await pool.query("SELECT * FROM testimonials ORDER BY id ASC");
        return res.json(result.rows);
      }
      res.json(staticTestimonials);
    } catch (error: any) {
      console.log("Testimonials DB query offline, utilizing memory fallback:", error.message || error);
      res.json(staticTestimonials);
    }
  });

  // --- FAQS API ---
  app.get("/api/faqs", async (req, res) => {
    try {
      if (isDbConfigured && isDbHealthy) {
        const result = await pool.query("SELECT * FROM faqs ORDER BY id ASC");
        return res.json(result.rows);
      }
      res.json(staticFaqs);
    } catch (error: any) {
      console.log("FAQs DB query offline, utilizing memory fallback:", error.message || error);
      res.json(staticFaqs);
    }
  });

  // --- BASE64 IMAGE UPLOAD API ---
  app.post("/api/upload", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image content provided." });
      }

      // 1. If Supabase is fully configured, try uploading to Supabase Storage
      if (supabaseClient) {
        console.log("=== SUPABASE UPLOAD ATTEMPT ===");
        console.log(`- Target Bucket Name: "${SUPABASE_STORAGE_BUCKET}"`);
        console.log(`- Is SUPABASE_SERVICE_ROLE_KEY present: ${Boolean(SUPABASE_SERVICE_ROLE_KEY)}`);
        console.log(`- Is SUPABASE_ANON_KEY being used on server: false (strictly avoided)`);

        try {
          let base64Data = image;
          let mimeType = "image/jpeg";
          let extension = "jpg";

          if (image.startsWith("data:")) {
            const match = image.match(/^data:([^;]+);base64,(.*)$/);
            if (match) {
              mimeType = match[1];
              base64Data = match[2];
              const extMatch = mimeType.match(/\/([a-zA-Z0-9]+)$/);
              if (extMatch) {
                extension = extMatch[1];
              }
            }
          }

          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

          // Try to create the bucket if it doesn't exist (public: true)
          try {
            await supabaseClient.storage.createBucket(SUPABASE_STORAGE_BUCKET, { public: true });
          } catch (bucketErr: any) {
            handleSupabaseError(bucketErr);
          }

          if (supabaseClient) {
            console.log(`- Uploading file: "${fileName}" of type "${mimeType}" (${buffer.length} bytes)`);

            const uploadPromise = supabaseClient.storage
              .from(SUPABASE_STORAGE_BUCKET)
              .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: false
              });
            
            const uploadTimeout = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Supabase upload timeout")), 30000)
            );

            const { data: uploadData, error: uploadErr } = await Promise.race([
              uploadPromise,
              uploadTimeout
            ]);

            if (uploadErr) {
              console.error("- Supabase storage upload error details:", uploadErr);
              handleSupabaseError(uploadErr);
              return res.status(500).json({
                error: "Supabase storage upload error",
                details: uploadErr.message,
                error_code: (uploadErr as any).statusCode || (uploadErr as any).status || "Unknown"
              });
            }

            if (uploadData) {
              const { data: publicUrlData } = supabaseClient.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .getPublicUrl(fileName);
              
              if (publicUrlData && publicUrlData.publicUrl) {
                console.log("- Successfully uploaded to Supabase Storage:", publicUrlData.publicUrl);
                return res.json({ url: publicUrlData.publicUrl });
              }
            }
          }

          return res.status(500).json({ error: "Failed to upload or retrieve public URL" });
        } catch (supabaseErr: any) {
          console.error("- Supabase storage upload exception details:", supabaseErr);
          handleSupabaseError(supabaseErr);
          return res.status(500).json({
            error: "Supabase storage upload exception",
            details: supabaseErr.message || supabaseErr
          });
        }
      } else {
        console.warn("Supabase client is not initialized on backend. Returning Base64 data URI directly...");
        return res.json({ url: image });
      }
    } catch (error: any) {
      console.error("Upload endpoint error:", error);
      res.status(500).json({ error: "Failed to upload image", details: error.message });
    }
  });

  // --- WEBSITE CONTENT APIs ---
  app.get("/api/website-content/:key", async (req, res) => {
    try {
      const { key } = req.params;
      if (isDbConfigured && isDbHealthy) {
        try {
          if (key === "page_images") {
            const homeRes = await pool.query("SELECT image_key, image_url FROM home_page_images");
            const aboutRes = await pool.query("SELECT image_key, image_url FROM about_page_images");
            const servicesRes = await pool.query("SELECT image_key, image_url FROM services_page_images");
            const productsRes = await pool.query("SELECT image_key, image_url FROM products_page_images");
            const contactRes = await pool.query("SELECT image_key, image_url FROM contact_page_images");

            const dbPageImages: any = {
              home: {},
              about: {},
              services: {},
              products: {},
              contact: {}
            };

            // Reconstruct home
            for (const row of homeRes.rows) {
              dbPageImages.home[row.image_key] = row.image_url;
            }

            // Reconstruct about
            const companyImagesMap: Record<number, string> = {};
            const teamImagesMap: Record<number, string> = {};
            for (const row of aboutRes.rows) {
              if (row.image_key.startsWith("company_images_")) {
                const idx = parseInt(row.image_key.replace("company_images_", ""), 10);
                if (!isNaN(idx)) companyImagesMap[idx] = row.image_url;
              } else if (row.image_key.startsWith("team_images_")) {
                const idx = parseInt(row.image_key.replace("team_images_", ""), 10);
                if (!isNaN(idx)) teamImagesMap[idx] = row.image_url;
              } else {
                dbPageImages.about[row.image_key] = row.image_url;
              }
            }
            dbPageImages.about.company_images = Object.keys(companyImagesMap).sort((a, b) => Number(a) - Number(b)).map(k => companyImagesMap[Number(k)]);
            dbPageImages.about.team_images = Object.keys(teamImagesMap).sort((a, b) => Number(a) - Number(b)).map(k => teamImagesMap[Number(k)]);

            // Reconstruct services
            const serviceBannersMap: Record<number, string> = {};
            const serviceIconsMap: Record<number, string> = {};
            const servicesGalleryMap: Record<number, string> = {};
            for (const row of servicesRes.rows) {
              if (row.image_key.startsWith("service_banners_")) {
                const idx = parseInt(row.image_key.replace("service_banners_", ""), 10);
                if (!isNaN(idx)) serviceBannersMap[idx] = row.image_url;
              } else if (row.image_key.startsWith("service_icons_")) {
                const idx = parseInt(row.image_key.replace("service_icons_", ""), 10);
                if (!isNaN(idx)) serviceIconsMap[idx] = row.image_url;
              } else if (row.image_key.startsWith("gallery_")) {
                const idx = parseInt(row.image_key.replace("gallery_", ""), 10);
                if (!isNaN(idx)) servicesGalleryMap[idx] = row.image_url;
              } else {
                dbPageImages.services[row.image_key] = row.image_url;
              }
            }
            dbPageImages.services.service_banners = Object.keys(serviceBannersMap).sort((a, b) => Number(a) - Number(b)).map(k => serviceBannersMap[Number(k)]);
            dbPageImages.services.service_icons = Object.keys(serviceIconsMap).sort((a, b) => Number(a) - Number(b)).map(k => serviceIconsMap[Number(k)]);
            dbPageImages.services.gallery = Object.keys(servicesGalleryMap).sort((a, b) => Number(a) - Number(b)).map(k => servicesGalleryMap[Number(k)]);

            // Reconstruct products
            const prodBannersMap: Record<number, string> = {};
            const prodImagesMap: Record<number, string> = {};
            for (const row of productsRes.rows) {
              if (row.image_key.startsWith("product_banners_")) {
                const idx = parseInt(row.image_key.replace("product_banners_", ""), 10);
                if (!isNaN(idx)) prodBannersMap[idx] = row.image_url;
              } else if (row.image_key.startsWith("product_images_")) {
                const idx = parseInt(row.image_key.replace("product_images_", ""), 10);
                if (!isNaN(idx)) prodImagesMap[idx] = row.image_url;
              } else {
                dbPageImages.products[row.image_key] = row.image_url;
              }
            }
            dbPageImages.products.product_banners = Object.keys(prodBannersMap).sort((a, b) => Number(a) - Number(b)).map(k => prodBannersMap[Number(k)]);
            dbPageImages.products.product_images = Object.keys(prodImagesMap).sort((a, b) => Number(a) - Number(b)).map(k => prodImagesMap[Number(k)]);

            // Reconstruct contact
            const officeImagesMap: Record<number, string> = {};
            for (const row of contactRes.rows) {
              if (row.image_key.startsWith("office_images_")) {
                const idx = parseInt(row.image_key.replace("office_images_", ""), 10);
                if (!isNaN(idx)) officeImagesMap[idx] = row.image_url;
              } else {
                dbPageImages.contact[row.image_key] = row.image_url;
              }
            }
            dbPageImages.contact.office_images = Object.keys(officeImagesMap).sort((a, b) => Number(a) - Number(b)).map(k => officeImagesMap[Number(k)]);

            // Merge with standard DB/fallback to fill in missing items
            const fallbackObj = activeWebsiteContent.page_images || {};
            const merged = {
              home: { ...fallbackObj.home, ...dbPageImages.home },
              about: { 
                ...fallbackObj.about, 
                ...dbPageImages.about,
                company_images: dbPageImages.about.company_images.length > 0 ? dbPageImages.about.company_images : (fallbackObj.about?.company_images || []),
                team_images: dbPageImages.about.team_images.length > 0 ? dbPageImages.about.team_images : (fallbackObj.about?.team_images || [])
              },
              services: {
                ...fallbackObj.services,
                ...dbPageImages.services,
                service_banners: dbPageImages.services.service_banners.length > 0 ? dbPageImages.services.service_banners : (fallbackObj.services?.service_banners || []),
                service_icons: dbPageImages.services.service_icons.length > 0 ? dbPageImages.services.service_icons : (fallbackObj.services?.service_icons || []),
                gallery: dbPageImages.services.gallery.length > 0 ? dbPageImages.services.gallery : (fallbackObj.services?.gallery || [])
              },
              products: {
                ...fallbackObj.products,
                ...dbPageImages.products,
                product_banners: dbPageImages.products.product_banners.length > 0 ? dbPageImages.products.product_banners : (fallbackObj.products?.product_banners || []),
                product_images: dbPageImages.products.product_images.length > 0 ? dbPageImages.products.product_images : (fallbackObj.products?.product_images || [])
              },
              contact: {
                ...fallbackObj.contact,
                ...dbPageImages.contact,
                office_images: dbPageImages.contact.office_images.length > 0 ? dbPageImages.contact.office_images : (fallbackObj.contact?.office_images || [])
              }
            };

            activeWebsiteContent.page_images = merged;
            saveFallbackData();
            return res.json(merged);
          }

          const result = await pool.query("SELECT value FROM website_content WHERE key = $1 LIMIT 1", [key]);
          if (result.rows.length > 0) {
            // Dynamically sync DB content values to fallback store
            activeWebsiteContent[key] = result.rows[0].value;
            saveFallbackData();
            return res.json(result.rows[0].value);
          }
        } catch (dbErr: any) {
          console.warn(`Database GET failed for website-content key '${key}', falling back to in-memory:`, dbErr.message);
        }
      }
      return res.json(activeWebsiteContent[key] || {});
    } catch (error: any) {
      console.warn(`Error fetching website-content key '${req.params.key}':`, error.message || error);
      res.json(activeWebsiteContent[req.params.key] || {});
    }
  });

  app.post("/api/website-content/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const payload = req.body;

      if (isDbConfigured && isDbHealthy) {
        try {
          await pool.query(
            `INSERT INTO website_content (key, value)
             VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
            [key, JSON.stringify(payload)]
          );

          if (key === "page_images") {
            try {
              // Sync home_page_images
              if (payload.home) {
                for (const [imgKey, val] of Object.entries(payload.home)) {
                  if (typeof val === "string") {
                    await pool.query(
                      "INSERT INTO home_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO UPDATE SET image_url = EXCLUDED.image_url",
                      [imgKey, val]
                    );
                  }
                }
              }
              // Sync about_page_images
              if (payload.about) {
                for (const [imgKey, val] of Object.entries(payload.about)) {
                  if (Array.isArray(val)) {
                    for (let i = 0; i < val.length; i++) {
                      await pool.query(
                        "INSERT INTO about_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO UPDATE SET image_url = EXCLUDED.image_url",
                        [`${imgKey}_${i}`, val[i]]
                      );
                    }
                  } else if (typeof val === "string") {
                    await pool.query(
                      "INSERT INTO about_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO UPDATE SET image_url = EXCLUDED.image_url",
                      [imgKey, val]
                    );
                  }
                }
              }
              // Sync services_page_images
              if (payload.services) {
                for (const [imgKey, val] of Object.entries(payload.services)) {
                  if (Array.isArray(val)) {
                    for (let i = 0; i < val.length; i++) {
                      await pool.query(
                        "INSERT INTO services_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO UPDATE SET image_url = EXCLUDED.image_url",
                        [`${imgKey}_${i}`, val[i]]
                      );
                    }
                  } else if (typeof val === "string") {
                    await pool.query(
                      "INSERT INTO services_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO UPDATE SET image_url = EXCLUDED.image_url",
                      [imgKey, val]
                    );
                  }
                }
              }
              // Sync products_page_images
              if (payload.products) {
                for (const [imgKey, val] of Object.entries(payload.products)) {
                  if (Array.isArray(val)) {
                    for (let i = 0; i < val.length; i++) {
                      await pool.query(
                        "INSERT INTO products_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO UPDATE SET image_url = EXCLUDED.image_url",
                        [`${imgKey}_${i}`, val[i]]
                      );
                    }
                  } else if (typeof val === "string") {
                    await pool.query(
                      "INSERT INTO products_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO UPDATE SET image_url = EXCLUDED.image_url",
                      [imgKey, val]
                    );
                  }
                }
              }
              // Sync contact_page_images
              if (payload.contact) {
                for (const [imgKey, val] of Object.entries(payload.contact)) {
                  if (Array.isArray(val)) {
                    for (let i = 0; i < val.length; i++) {
                      await pool.query(
                        "INSERT INTO contact_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO UPDATE SET image_url = EXCLUDED.image_url",
                        [`${imgKey}_${i}`, val[i]]
                      );
                    }
                  } else if (typeof val === "string") {
                    await pool.query(
                      "INSERT INTO contact_page_images (image_key, image_url) VALUES ($1, $2) ON CONFLICT (image_key) DO UPDATE SET image_url = EXCLUDED.image_url",
                      [imgKey, val]
                    );
                  }
                }
              }
              console.log("Successfully synced separate page image tables from website content POST.");
            } catch (syncErr: any) {
              console.error("Failed to sync separate page image tables:", syncErr.message);
            }
          }

          // Sync memory too so local changes are immediately queryable
          activeWebsiteContent[key] = payload;
          saveFallbackData();
          return res.json({ success: true, message: `Successfully saved website content for '${key}'.` });
        } catch (dbErr: any) {
          console.error(`Database save failed for website-content key '${key}', falling back to in-memory store:`, dbErr.message);
        }
      }

      activeWebsiteContent[key] = payload;
      saveFallbackData();
      res.json({ success: true, message: `Successfully saved '${key}' to dynamic fallback storage.`, value: payload });
    } catch (error: any) {
      console.error(`Error saving website-content key '${req.params.key}':`, error);
      res.status(500).json({ error: "Failed to save website content", details: error.message });
    }
  });

  // --- CATEGORIES CRUD APIs ---
  app.post("/api/categories", async (req, res) => {
    try {
      const { title, description, image } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required for a category." });
      }

      let newCat: any = null;

      if (isDbConfigured && isDbHealthy) {
        try {
          const insertRes = await pool.query(
            "INSERT INTO categories (title, description, image) VALUES ($1, $2, $3) RETURNING *",
            [title, description || "", image || ""]
          );
          newCat = insertRes.rows[0];
        } catch (dbErr: any) {
          console.error("Database category creation failed, falling back to memory:", dbErr.message);
        }
      }

      if (!newCat) {
        newCat = {
          id: String(activeCategories.length + 100),
          title,
          description: description || "",
          image: image || ""
        };
      }

      // Sync fallback categories in memory and on disk
      const exists = activeCategories.some(c => String(c.id) === String(newCat.id) || c.title === newCat.title);
      if (!exists) {
        activeCategories.push(newCat);
      } else {
        // Update existing fallback item if it exists
        const idx = activeCategories.findIndex(c => String(c.id) === String(newCat.id) || c.title === newCat.title);
        if (idx !== -1) {
          activeCategories[idx] = { ...activeCategories[idx], ...newCat };
        }
      }
      saveFallbackData();
      res.status(201).json(newCat);
    } catch (error: any) {
      console.error("Failed to create category:", error);
      res.status(500).json({ error: "Failed to create category", details: error.message });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const catIdStr = req.params.id;
      const { title, description, image } = req.body;

      let updatedCat: any = null;

      if (isDbConfigured && isDbHealthy && !String(catIdStr).startsWith('fallback_')) {
        const catId = parseInt(catIdStr, 10);
        if (!isNaN(catId)) {
          try {
            const updateRes = await pool.query(
              "UPDATE categories SET title = $1, description = $2, image = $3 WHERE id = $4 RETURNING *",
              [title, description || "", image || "", catId]
            );
            if (updateRes.rows.length > 0) {
              updatedCat = updateRes.rows[0];
            }
          } catch (dbErr: any) {
            console.error("Database category update failed, falling back to memory:", dbErr.message);
          }
        }
      }

      // Sync to fallback memory
      const index = activeCategories.findIndex(c => String((c as any).id) === catIdStr || c.title === catIdStr);
      if (index !== -1) {
        activeCategories[index] = {
          ...activeCategories[index],
          title,
          description: description || "",
          image: image || ""
        };
        if (updatedCat) {
          activeCategories[index] = { ...activeCategories[index], ...updatedCat };
        }
        saveFallbackData();
        return res.json(activeCategories[index]);
      } else if (updatedCat) {
        activeCategories.push(updatedCat);
        saveFallbackData();
        return res.json(updatedCat);
      }

      res.status(404).json({ error: "Category not found to update." });
    } catch (error: any) {
      console.error("Failed to update category:", error);
      res.status(500).json({ error: "Failed to update category", details: error.message });
    }
  });

  app.delete("/api/categories", async (req, res) => {
    try {
      if (isDbConfigured && isDbHealthy) {
        try {
          await pool.query("DELETE FROM categories");
        } catch (dbErr: any) {
          console.error("Database categories deletion failed:", dbErr.message);
        }
      }
      activeCategories = [];
      saveFallbackData();
      res.json({ success: true, message: "All categories and dummy data removed successfully." });
    } catch (error: any) {
      console.error("Failed to delete all categories:", error);
      res.status(500).json({ error: "Failed to delete all categories", details: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const catIdStr = req.params.id;

      let dbDeleted = false;

      if (isDbConfigured && isDbHealthy && !String(catIdStr).startsWith('fallback_')) {
        const catId = parseInt(catIdStr, 10);
        if (!isNaN(catId)) {
          try {
            await pool.query("DELETE FROM categories WHERE id = $1", [catId]);
            dbDeleted = true;
          } catch (dbErr: any) {
            console.error("Database category deletion failed, falling back to memory:", dbErr.message);
          }
        } else {
          try {
            await pool.query("DELETE FROM categories WHERE title = $1", [catIdStr]);
            dbDeleted = true;
          } catch (dbErr: any) {
            console.error("Database category deletion by title failed, falling back to memory:", dbErr.message);
          }
        }
      }

      const initialLen = activeCategories.length;
      activeCategories = activeCategories.filter(c => String((c as any).id) !== catIdStr && c.title !== catIdStr);
      if (activeCategories.length < initialLen || dbDeleted) {
        saveFallbackData();
        return res.json({ success: true, message: "Category deleted from database and/or fallback memory." });
      }

      res.status(404).json({ error: "Category not found to delete." });
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      res.status(500).json({ error: "Failed to delete category", details: error.message });
    }
  });

  // --- MEDIA LIBRARY CRUD APIs ---
  app.get("/api/media-library", async (req, res) => {
    try {
      const { section } = req.query;
      if (isDbConfigured && isDbHealthy) {
        let query = "SELECT * FROM gallery_images";
        const params: any[] = [];
        if (section) {
          query += " WHERE section = $1";
          params.push(section);
        }
        query += " ORDER BY sort_order ASC, id DESC";
        const result = await pool.query(query, params);
        const mapped = result.rows.map(r => ({
          id: r.id,
          image_url: r.image_url,
          imageUrl: r.image_url,
          instagram_url: r.instagram_url,
          instagramUrl: r.instagram_url,
          sort_order: r.sort_order,
          sortOrder: r.sort_order,
          section: r.section
        }));
        return res.json(mapped);
      }
      let filtered = [...activeGalleryImages];
      if (section) {
        filtered = filtered.filter(img => img.section === section);
      }
      res.json(filtered);
    } catch (error: any) {
      console.log("Media library DB query offline, utilizing memory fallback:", error.message || error);
      let filtered = [...activeGalleryImages];
      const { section } = req.query;
      if (section) {
        filtered = filtered.filter(img => img.section === section);
      }
      res.json(filtered);
    }
  });

  app.post("/api/media-library", async (req, res) => {
    try {
      const { image_url, instagram_url, sort_order, section } = req.body;
      if (!image_url) {
        return res.status(400).json({ error: "image_url is required." });
      }

      const secVal = section || "gallery";

      if (isDbConfigured && isDbHealthy) {
        try {
          const result = await pool.query(
            "INSERT INTO gallery_images (image_url, instagram_url, sort_order, section) VALUES ($1, $2, $3, $4) RETURNING *",
            [image_url, instagram_url || "https://www.instagram.com/a.h.r.perfumes_/", sort_order || 0, secVal]
          );
          const r = result.rows[0];
          return res.status(201).json({
            id: r.id,
            image_url: r.image_url,
            imageUrl: r.image_url,
            instagram_url: r.instagram_url,
            instagramUrl: r.instagram_url,
            sort_order: r.sort_order,
            sortOrder: r.sort_order,
            section: r.section
          });
        } catch (dbErr: any) {
          console.error("Database save to media-library failed, falling back to memory:", dbErr.message);
        }
      }

      const newId = `fallback_${activeGalleryImages.length + 1}`;
      const newImg = { 
        id: newId, 
        image_url, 
        instagram_url: instagram_url || "https://www.instagram.com/a.h.r.perfumes_/", 
        sort_order: sort_order !== undefined ? sort_order : activeGalleryImages.length,
        section: secVal
      };
      activeGalleryImages.push(newImg);
      saveFallbackData();
      res.status(201).json(newImg);
    } catch (error: any) {
      console.error("Failed to add to media library:", error);
      res.status(500).json({ error: "Failed to add to media library", details: error.message });
    }
  });

  app.delete("/api/media-library/:id", async (req, res) => {
    try {
      const mediaIdStr = req.params.id;

      let deletedFromDb = false;
      if (isDbConfigured && isDbHealthy && !String(mediaIdStr).startsWith('fallback_')) {
        const mediaId = parseInt(mediaIdStr, 10);
        if (!isNaN(mediaId)) {
          try {
            await pool.query("DELETE FROM gallery_images WHERE id = $1", [mediaId]);
            deletedFromDb = true;
          } catch (dbErr: any) {
            console.error("Database deletion from media-library failed, falling back to memory:", dbErr.message);
          }
        }
      }

      // Memory delete (always run as secondary backup to keep in sync, or primary if DB offline)
      const initialLen = activeGalleryImages.length;
      activeGalleryImages = activeGalleryImages.filter(img => {
        const idStr = String(mediaIdStr);
        const imgIdStr = String(img.id);
        const matchesDirect = imgIdStr === idStr;
        const matchesMapped = 
          (idStr.startsWith("fallback_") && imgIdStr === idStr.replace("fallback_", "")) ||
          (imgIdStr.startsWith("fallback_") && imgIdStr.replace("fallback_", "") === idStr);
        return !matchesDirect && !matchesMapped;
      });

      if (deletedFromDb || activeGalleryImages.length < initialLen) {
        saveFallbackData();
        return res.json({ success: true, message: "Image removed successfully." });
      }

      res.status(404).json({ error: "Image not found to delete." });
    } catch (error: any) {
      console.error("Failed to delete from media library:", error);
      res.status(500).json({ error: "Failed to delete image", details: error.message });
    }
  });

  // --- SPECIFIC GALLERY IMAGES APIs ---
  app.get("/api/gallery-images", async (req, res) => {
    try {
      if (isDbConfigured && isDbHealthy) {
        const result = await pool.query(
          "SELECT * FROM gallery_images WHERE section = 'gallery' OR section IS NULL OR section = '' ORDER BY sort_order ASC, id ASC"
        );
        const mapped = result.rows.map(r => ({
          id: r.id,
          image_url: r.image_url,
          imageUrl: r.image_url,
          instagram_url: r.instagram_url,
          instagramUrl: r.instagram_url,
          sort_order: r.sort_order,
          sortOrder: r.sort_order,
          section: r.section
        }));
        return res.json(mapped);
      }
      // Sort activeGalleryImages by sort_order, only return gallery images
      const filtered = activeGalleryImages.filter(img => !img.section || img.section === "gallery");
      const sorted = [...filtered].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      res.json(sorted);
    } catch (error: any) {
      console.log("Gallery images DB query offline, utilizing memory fallback:", error.message || error);
      const filtered = activeGalleryImages.filter(img => !img.section || img.section === "gallery");
      res.json(filtered);
    }
  });

  app.post("/api/gallery-images", async (req, res) => {
    try {
      const { image_url, instagram_url, sort_order, section } = req.body;
      if (!image_url) {
        return res.status(400).json({ error: "image_url is required." });
      }

      const secVal = section || "gallery";

      if (isDbConfigured && isDbHealthy) {
        try {
          const result = await pool.query(
            "INSERT INTO gallery_images (image_url, instagram_url, sort_order, section) VALUES ($1, $2, $3, $4) RETURNING *",
            [image_url, instagram_url || "https://www.instagram.com/a.h.r.perfumes_/", sort_order || 0, secVal]
          );
          const r = result.rows[0];
          return res.status(201).json({
            id: r.id,
            image_url: r.image_url,
            imageUrl: r.image_url,
            instagram_url: r.instagram_url,
            instagramUrl: r.instagram_url,
            sort_order: r.sort_order,
            sortOrder: r.sort_order,
            section: r.section
          });
        } catch (dbErr: any) {
          console.error("Database save to gallery_images failed, falling back to memory:", dbErr.message);
        }
      }

      const newId = `fallback_${activeGalleryImages.length + 1}`;
      const newImg = { 
        id: newId, 
        image_url, 
        instagram_url: instagram_url || "https://www.instagram.com/a.h.r.perfumes_/", 
        sort_order: sort_order !== undefined ? sort_order : activeGalleryImages.length,
        section: secVal
      };
      activeGalleryImages.push(newImg);
      saveFallbackData();
      res.status(201).json(newImg);
    } catch (error: any) {
      console.error("Failed to add gallery image:", error);
      res.status(500).json({ error: "Failed to add gallery image", details: error.message });
    }
  });

  app.put("/api/gallery-images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { image_url, instagram_url, sort_order } = req.body;

      if (isDbConfigured && isDbHealthy && !String(id).startsWith("fallback_")) {
        const dbId = parseInt(id, 10);
        if (!isNaN(dbId)) {
          try {
            const result = await pool.query(
              `UPDATE gallery_images 
               SET image_url = COALESCE($1, image_url), 
                   instagram_url = COALESCE($2, instagram_url), 
                   sort_order = COALESCE($3, sort_order)
               WHERE id = $4 RETURNING *`,
              [image_url || null, instagram_url || null, sort_order !== undefined ? sort_order : null, dbId]
            );
            if (result.rows.length > 0) {
              const r = result.rows[0];
              return res.json({
                id: r.id,
                image_url: r.image_url,
                imageUrl: r.image_url,
                instagram_url: r.instagram_url,
                instagramUrl: r.instagram_url,
                sort_order: r.sort_order,
                sortOrder: r.sort_order
              });
            }
          } catch (dbErr: any) {
            console.error("Database update of gallery_images failed, falling back to memory:", dbErr.message);
          }
        }
      }

      // Memory fallback update
      const index = activeGalleryImages.findIndex(img => String(img.id) === id);
      if (index !== -1) {
        if (image_url !== undefined) activeGalleryImages[index].image_url = image_url;
        if (instagram_url !== undefined) activeGalleryImages[index].instagram_url = instagram_url;
        if (sort_order !== undefined) activeGalleryImages[index].sort_order = sort_order;
        saveFallbackData();
        return res.json(activeGalleryImages[index]);
      }

      res.status(404).json({ error: "Gallery image not found to update." });
    } catch (error: any) {
      console.error("Failed to update gallery image:", error);
      res.status(500).json({ error: "Failed to update gallery image", details: error.message });
    }
  });

  app.delete("/api/gallery-images/:id", async (req, res) => {
    try {
      const { id } = req.params;

      let deletedFromDb = false;
      if (isDbConfigured && isDbHealthy && !String(id).startsWith("fallback_")) {
        const dbId = parseInt(id, 10);
        if (!isNaN(dbId)) {
          try {
            await pool.query("DELETE FROM gallery_images WHERE id = $1", [dbId]);
            deletedFromDb = true;
          } catch (dbErr: any) {
            console.error("Database delete from gallery_images failed, falling back to memory:", dbErr.message);
          }
        }
      }

      // Memory delete (always run as secondary backup to keep in sync, or primary if DB offline)
      const initialLen = activeGalleryImages.length;
      activeGalleryImages = activeGalleryImages.filter(img => {
        const idStr = String(id);
        const imgIdStr = String(img.id);
        const matchesDirect = imgIdStr === idStr;
        const matchesMapped = 
          (idStr.startsWith("fallback_") && imgIdStr === idStr.replace("fallback_", "")) ||
          (imgIdStr.startsWith("fallback_") && imgIdStr.replace("fallback_", "") === idStr);
        return !matchesDirect && !matchesMapped;
      });

      if (deletedFromDb || activeGalleryImages.length < initialLen) {
        saveFallbackData();
        return res.json({ success: true, message: "Gallery image deleted successfully." });
      }

      res.status(404).json({ error: "Gallery image not found to delete." });
    } catch (error: any) {
      console.error("Failed to delete gallery image:", error);
      res.status(500).json({ error: "Failed to delete gallery image", details: error.message });
    }
  });

  // --- INQUIRIES APIs ---
  app.get("/api/inquiries", async (req, res) => {
    try {
      if (isDbConfigured && isDbHealthy) {
        try {
          const result = await pool.query("SELECT * FROM inquiries ORDER BY id DESC");
          const dbInquiries = result.rows.map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            inquiryType: r.inquiry_type || r.inquiryType || "General Inquiry",
            message: r.message,
            createdAt: r.created_at || r.createdAt
          }));
          // Sync to memory
          activeInquiries = dbInquiries;
          return res.json(dbInquiries);
        } catch (dbErr: any) {
          console.error("Failed to query inquiries from DB, returning fallback:", dbErr);
        }
      }
      res.json(activeInquiries);
    } catch (error: any) {
      console.error("Failed to fetch inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries", details: error.message });
    }
  });

  app.post("/api/inquiries", async (req, res) => {
    try {
      const { name, email, phone, inquiryType, message } = req.body;
      if (!name || !email || !phone || !message) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      const newInquiry = {
        id: "fallback_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        name,
        email,
        phone,
        inquiryType: inquiryType || "General Inquiry",
        message,
        createdAt: new Date().toISOString()
      };

      if (isDbConfigured && isDbHealthy) {
        try {
          const result = await pool.query(
            `INSERT INTO inquiries (name, email, phone, inquiry_type, message)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, email, phone, inquiryType || "General Inquiry", message]
          );
          if (result.rows.length > 0) {
            const row = result.rows[0];
            const savedInquiry = {
              id: row.id,
              name: row.name,
              email: row.email,
              phone: row.phone,
              inquiryType: row.inquiry_type || row.inquiryType || "General Inquiry",
              message: row.message,
              createdAt: row.created_at || row.createdAt
            };
            // Prepend to memory
            activeInquiries.unshift(savedInquiry);
            await saveFallbackData();
            return res.status(201).json({ success: true, inquiry: savedInquiry });
          }
        } catch (dbErr: any) {
          console.error("Failed to save inquiry to DB, using fallback:", dbErr);
        }
      }

      // Memory fallback path
      activeInquiries.unshift(newInquiry);
      await saveFallbackData();
      res.status(201).json({ success: true, inquiry: newInquiry });
    } catch (error: any) {
      console.error("Failed to create inquiry:", error);
      res.status(500).json({ error: "Failed to create inquiry", details: error.message });
    }
  });

  app.delete("/api/inquiries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let deletedFromDb = false;

      if (isDbConfigured && isDbHealthy && !String(id).startsWith("fallback_")) {
        const dbId = parseInt(id, 10);
        if (!isNaN(dbId)) {
          try {
            await pool.query("DELETE FROM inquiries WHERE id = $1", [dbId]);
            deletedFromDb = true;
          } catch (dbErr: any) {
            console.error("Failed to delete inquiry from DB, falling back to memory:", dbErr.message);
          }
        }
      }

      const initialLen = activeInquiries.length;
      activeInquiries = activeInquiries.filter(item => String(item.id) !== String(id));

      if (deletedFromDb || activeInquiries.length < initialLen) {
        await saveFallbackData();
        return res.json({ success: true, message: "Inquiry deleted successfully." });
      }

      res.status(404).json({ error: "Inquiry not found to delete." });
    } catch (error: any) {
      console.error("Failed to delete inquiry:", error);
      res.status(500).json({ error: "Failed to delete inquiry", details: error.message });
    }
  });

  // --- OAUTH CALLBACK NATIVE ROUTE ---
  app.get("/auth/callback", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Security Gate</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #FAF9F6;
              color: #1f2937;
            }
            .card {
              text-align: center;
              padding: 40px 32px;
              border: 1px solid #e5e7eb;
              background: white;
              border-radius: 16px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
              max-width: 420px;
              width: 90%;
              box-sizing: border-box;
            }
            .spinner {
              width: 28px;
              height: 28px;
              border: 2px solid #C5A059;
              border-top-color: transparent;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h2 {
              margin: 0 0 8px 0;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.15em;
              color: #6b7280;
            }
            p {
              font-size: 13px;
              color: #4b5563;
              line-height: 1.5;
              margin: 0;
            }
            .error-title {
              font-weight: 600;
              margin-bottom: 8px;
              color: #dc2626;
            }
            .error-box {
              font-family: monospace;
              font-size: 11px;
              background: #fef2f2;
              color: #b91c1c;
              padding: 10px 14px;
              border-radius: 6px;
              border: 1px solid #fca5a5;
              overflow-wrap: break-word;
              text-align: left;
              margin-bottom: 16px;
            }
            .instructions {
              text-align: left;
              font-size: 12px;
              color: #4b5563;
              line-height: 1.5;
              background: #fffbeb;
              border: 1px solid #fde68a;
              padding: 14px;
              border-radius: 8px;
            }
            .success-text {
              color: #059669;
            }
          </style>
        </head>
        <body>
          <div id="status-card" class="card">
            <div id="loader" class="spinner"></div>
            <h2>Security Gate</h2>
            <p id="status">Validating authorization signature...</p>
          </div>

          <div id="error-card" class="card" style="display: none; max-width: 480px;">
            <h2>Security Gate</h2>
            <div class="error-title">Authentication Failed</div>
            <div id="error-message" class="error-box"></div>
            <div class="instructions">
              <strong style="color: #d97706; display: block; margin-bottom: 6px;">💡 How to Fix:</strong>
              <ol style="margin: 0; padding-left: 16px;">
                <li style="margin-bottom: 6px;"><strong>Enable Google Provider:</strong> In your <a href="https://supabase.com" target="_blank" style="color:#C5A059; text-decoration:underline;">Supabase Dashboard</a>, go to <strong>Authentication → Providers → Google</strong>, and toggle <strong>"Enable Google Provider"</strong> to on.</li>
                <li style="margin-bottom: 6px;"><strong>Setup Credentials:</strong> Ensure your Google Cloud <strong>Client ID</strong> &amp; <strong>Client Secret</strong> are entered correctly inside Supabase settings.</li>
                <li style="margin-bottom: 6px;"><strong>Authorized Redirect URI:</strong> Copy the Redirect URI from Supabase's Google setting, and paste it under <strong>Authorized redirect URIs</strong> in your Google APIs &amp; Services Credentials panel.</li>
                <li><strong>Save Changes:</strong> Click "Save" inside your Supabase Google Provider configuration layout.</li>
              </ol>
            </div>
          </div>

          <script>
            console.log("Security Gate Script Loaded.");
            
            var params = {};
            
            var searchParams = new URLSearchParams(window.location.search);
            searchParams.forEach(function(value, key) {
              params[key] = value;
            });
            
            var hash = window.location.hash.substring(1);
            if (hash) {
              var hashParams = new URLSearchParams(hash);
              hashParams.forEach(function(value, key) {
                params[key] = value;
              });
            }

            var rawErrorName = params.error;
            var rawDescription = params.error_description;
            
            var errorText = "";
            if (rawErrorName || rawDescription) {
              var desc = rawDescription ? decodeURIComponent(rawDescription.replace(/\\+/g, ' ')) : "";
              var name = rawErrorName ? decodeURIComponent(rawErrorName.replace(/\\+/g, ' ')) : "";
              errorText = desc ? (desc + " (" + name + ")") : name;
            }

            var accessToken = params.access_token;
            
            var statusEl = document.getElementById("status");
            var loaderEl = document.getElementById("loader");
            var statusCard = document.getElementById("status-card");
            var errorCard = document.getElementById("error-card");
            var errorMessage = document.getElementById("error-message");

            if (errorText) {
              console.error("Authentication error detected:", errorText);
              if (statusCard) statusCard.style.display = "none";
              if (errorCard) errorCard.style.display = "block";
              if (errorMessage) errorMessage.innerText = errorText;
              
              if (window.opener) {
                window.opener.postMessage({ 
                  type: "SUPABASE_OAUTH_ERROR", 
                  error: errorText
                }, "*");
              }
            } else if (accessToken) {
              console.log("OAuth Access token found in URL hash segment.");
              if (statusEl) {
                statusEl.className = "success-text";
                statusEl.innerText = "Signature validated! Finalizing secure session...";
              }
              
              if (window.opener) {
                window.opener.postMessage({ 
                  type: "SUPABASE_OAUTH_SUCCESS", 
                  hash: window.location.hash, 
                  search: window.location.search 
                }, "*");
                
                setTimeout(function() {
                  window.close();
                }, 1200);
              } else {
                window.location.href = "/" + window.location.hash;
              }
            } else {
              console.warn("No hash/query auth parameters found.");
              if (loaderEl) loaderEl.style.display = "none";
              if (statusEl) {
                statusEl.innerText = "No secure parameters found. You may close this window and try signing in again.";
              }
            }
          </script>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
