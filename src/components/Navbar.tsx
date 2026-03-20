import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-2xl font-bold text-gradient-gold">
          Nilex
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">
            Home
          </Link>
          <Link to="/cars" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">
            Cars
          </Link>
          <Link to="/real-estate" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">
            Real Estate
          </Link>
          <Link to="/post-ad">
            <Button variant="gold" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Post Ad
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="container flex flex-col gap-3 py-4">
              <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Home</Link>
              <Link to="/cars" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Cars</Link>
              <Link to="/real-estate" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Real Estate</Link>
              <Link to="/post-ad" onClick={() => setMobileOpen(false)}>
                <Button variant="gold" size="sm" className="w-full gap-1.5">
                  <Plus className="h-4 w-4" />
                  Post Ad
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
