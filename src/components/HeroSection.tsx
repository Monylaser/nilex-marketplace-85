import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/browse?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Cairo skyline" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background" />
      </div>

      <div className="container relative z-10 flex flex-col items-center py-24 text-center md:py-36">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl font-bold text-primary-foreground md:text-6xl lg:text-7xl"
        >
          Buy & Sell Across <span className="text-gradient-gold">Egypt</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-4 max-w-xl text-lg text-primary-foreground/70"
        >
          Egypt's trusted marketplace for cars, real estate, and more.
        </motion.p>

        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cars, apartments, villas..."
            className="flex-1 bg-transparent px-5 py-4 text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="submit"
            className="gradient-gold m-1.5 flex items-center gap-2 rounded-lg px-6 font-semibold text-accent-foreground transition hover:opacity-90"
          >
            <Search className="h-5 w-5" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default HeroSection;
