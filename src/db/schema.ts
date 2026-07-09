import { pgTable, serial, varchar, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  mobile: varchar("mobile", { length: 50 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user"), // "user" or "admin"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  image: text("image"),
  isBestSeller: boolean("is_best_seller").default(false),
  stock: integer("stock").default(0),
  sizes: text("sizes"), // JSON representation of ml variants and prices e.g. [{"size":"50ml","price":1200,"originalPrice":1500}]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(), // Assuming a simple string-based user session/ID for now
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const businessInfo = pgTable("business_info", {
  id: integer("id").primaryKey().default(1),
  name: varchar("name", { length: 255 }).notNull(),
  tagline: varchar("tagline", { length: 255 }),
  established: integer("established"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 100 }),
  instagram: varchar("instagram", { length: 100 }),
  owner: varchar("owner", { length: 100 }),
  rating: varchar("rating", { length: 50 }),
  yearsInBusiness: varchar("years_in_business", { length: 50 }),
  happyCustomers: varchar("happy_customers", { length: 50 }),
  totalProducts: varchar("total_products", { length: 50 }),
  hoursWeekdays: varchar("hours_weekdays", { length: 100 }),
  hoursSunday: varchar("hours_sunday", { length: 100 }),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image: text("image"),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  rating: integer("rating").default(5),
  text: text("text").notNull(),
  author: varchar("author", { length: 255 }).notNull(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
});

export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  instagramUrl: text("instagram_url"),
  sortOrder: integer("sort_order").default(0),
});

export const homePageImages = pgTable("home_page_images", {
  id: serial("id").primaryKey(),
  imageKey: varchar("image_key", { length: 255 }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aboutPageImages = pgTable("about_page_images", {
  id: serial("id").primaryKey(),
  imageKey: varchar("image_key", { length: 255 }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const servicesPageImages = pgTable("services_page_images", {
  id: serial("id").primaryKey(),
  imageKey: varchar("image_key", { length: 255 }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productsPageImages = pgTable("products_page_images", {
  id: serial("id").primaryKey(),
  imageKey: varchar("image_key", { length: 255 }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactPageImages = pgTable("contact_page_images", {
  id: serial("id").primaryKey(),
  imageKey: varchar("image_key", { length: 255 }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


