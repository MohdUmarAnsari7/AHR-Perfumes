import { motion } from "motion/react";

export function TopBar() {
  return (
    <div className="bg-gradient-to-r from-[#B68D40] via-[#F5E6C8] to-[#B68D40] text-black text-xs md:text-sm py-1.5 font-medium tracking-wider text-center overflow-hidden whitespace-nowrap">
      <motion.div
        initial={{ x: "0%" }}
        animate={{ x: "-100%" }}
        transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
        className="inline-block"
      >
        <span className="mx-4">PREMIUM ATTARS & FRAGRANCES DELIVERED ACROSS INDIA</span>
        <span className="mx-4">•</span>
        <span className="mx-4">WHOLESALE & RETAIL AVAILABLE</span>
        <span className="mx-4">•</span>
        <span className="mx-4">PREMIUM ATTARS & FRAGRANCES DELIVERED ACROSS INDIA</span>
        <span className="mx-4">•</span>
        <span className="mx-4">WHOLESALE & RETAIL AVAILABLE</span>
      </motion.div>
    </div>
  );
}
