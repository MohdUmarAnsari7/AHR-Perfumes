import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X, User } from "lucide-react";
import { cn } from "../lib/utils";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useCartStore } from "../store/useCart";
import { useAuthStore } from "../store/useAuth";
import { useFavoritesStore } from "../store/useFavorites";
import { useSearchStore } from "../store/useSearch";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Categories", href: "/categories" },
  { name: "About", href: "/about" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
  { name: "Owner Login", href: "/admin" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const itemsCount = items.reduce((total, item) => total + item.quantity, 0);
  const { isLoggedIn, user, signOut, openAuthModal } = useAuthStore();
  const info = useBusinessInfoStore((state) => state.info);
  const { items: favoriteItems, setIsOpen: setFavoritesOpen } = useFavoritesStore();
  const favoriteCount = favoriteItems.length;

  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { homeSearchQuery, setHomeSearchQuery } = useSearchStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "absolute lg:fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
          isScrolled
            ? "bg-white/95 backdrop-blur-md py-3 lg:shadow-lg lg:border-gray-200"
            : "bg-white/70 backdrop-blur-sm py-5"
        )}
        style={{ top: isScrolled ? (isMobile ? "auto" : "0") : "auto" }}
      >
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="font-serif text-2xl tracking-widest text-gold-accent hover:text-gold-primary transition-colors">
              {info.name}
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center xl:space-x-8 space-x-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-xs xl:text-sm uppercase tracking-widest text-gray-700 hover:text-gold-accent transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="hidden lg:flex items-center xl:space-x-6 space-x-4">
            <button 
              onClick={() => setFavoritesOpen(true)} 
              className="text-gray-700 hover:text-gold-accent transition-colors relative"
              title="View Wishlist"
            >
              <Heart className={cn("w-5 h-5", favoriteCount > 0 && "fill-gold-primary text-gold-accent")} />
              {favoriteCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-950 text-gold-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {favoriteCount}
                </span>
              )}
            </button>
            <Link to="/cart" className="text-gray-700 hover:text-gold-accent transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-gold-primary text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemsCount}
              </span>
            </Link>
            
            {/* My Account with Hover Dropdown */}
            <div className="relative group py-2">
              {isLoggedIn ? (
                <Link 
                  to="/account" 
                  className={cn(
                    "transition-colors relative flex items-center justify-center p-1 text-gold-accent hover:text-gold-primary"
                  )}
                  title={`Account Profile: ${user?.email}`}
                >
                  <User className="w-5 h-5" />
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-1 ring-white" />
                </Link>
              ) : (
                <button 
                  onClick={() => openAuthModal("login")}
                  className={cn(
                    "transition-colors relative flex items-center justify-center p-1 text-gray-700 hover:text-gold-accent cursor-pointer"
                  )}
                  title="Customer Login / Signup"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              {/* Hover Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-150 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-3 px-3">
                {!isLoggedIn ? (
                  <div className="flex flex-col space-y-2 font-sans">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center mb-1 font-semibold">
                      My Account
                    </p>
                    <button
                      onClick={() => openAuthModal("login")}
                      className="w-full text-center block bg-gray-950 hover:bg-gold-primary text-white hover:text-black py-2 text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => openAuthModal("signup")}
                      className="w-full text-center block border border-gray-250 hover:border-gold-accent text-gray-800 hover:text-gold-accent py-2 text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      Signup
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1 font-sans">
                    <div className="px-1 py-1 border-b border-gray-100 mb-2">
                      <p className="text-[9px] uppercase tracking-wider text-gray-400">Signed in as</p>
                      <p className="text-xs font-semibold text-gray-800 truncate font-mono">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                      </p>
                    </div>
                    <Link
                      to="/account"
                      className="w-full text-left block px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-gold-accent rounded transition-colors"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left block px-2 py-1.5 text-xs text-red-650 hover:bg-red-50 hover:text-red-700 rounded transition-colors font-medium cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            <a
              href={`https://wa.me/${info.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold-primary hover:bg-gold-accent text-black px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
            >
              WhatsApp
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-700 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 py-4 px-4 shadow-xl">
          <nav className="flex flex-col space-y-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm uppercase tracking-widest text-gray-700 hover:text-gold-accent"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between font-sans">
               <div className="flex space-x-4 items-center text-gray-700">
                  <button 
                    onClick={() => {
                      setFavoritesOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="relative text-gray-700 hover:text-gold-accent transition-colors"
                    title="View Wishlist"
                  >
                    <Heart className={cn("w-5 h-5", favoriteCount > 0 && "fill-gold-primary text-gold-accent")} />
                    {favoriteCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gray-950 text-gold-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {favoriteCount}
                      </span>
                    )}
                  </button>
                  <Link to="/cart" className="relative group" onClick={() => setMobileMenuOpen(false)}>
                    <ShoppingBag className="w-5 h-5 group-hover:text-gold-accent transition-colors" />
                    <span className="absolute -top-2 -right-2 bg-gold-primary text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {itemsCount}
                    </span>
                  </Link>
                  {isLoggedIn ? (
                    <Link 
                      to="/account" 
                      className="relative group flex items-center" 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5 text-gold-accent" />
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-1 ring-white" />
                    </Link>
                  ) : (
                    <button 
                      onClick={() => {
                        openAuthModal("login");
                        setMobileMenuOpen(false);
                      }}
                      className="relative group flex items-center text-gray-700 hover:text-gold-accent cursor-pointer" 
                    >
                      <User className="w-5 h-5" />
                    </button>
                  )}
               </div>
               <a
                href={`https://wa.me/${info.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold-primary text-black px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded"
              >
                WhatsApp
              </a>
            </div>
          </nav>
        </div>
      )}

    </header>
    </>
  );
}

