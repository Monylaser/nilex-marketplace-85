import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Menu, X, User, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-2xl font-bold text-gradient-gold">
          Nilex
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">Home</Link>
          <Link to="/browse" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">Browse</Link>
          <Link to="/browse?category=cars" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">Cars</Link>
          <Link to="/browse?category=real-estate" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">Real Estate</Link>

          <Link to="/post-ad">
            <Button variant="gold" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Post Ad
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> My account
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" /> Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth"><Button variant="outline" size="sm">Sign in</Button></Link>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
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
              <Link to="/browse" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Browse</Link>
              <Link to="/browse?category=cars" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Cars</Link>
              <Link to="/browse?category=real-estate" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Real Estate</Link>
              <Link to="/post-ad" onClick={() => setMobileOpen(false)}>
                <Button variant="gold" size="sm" className="w-full gap-1.5">
                  <Plus className="h-4 w-4" /> Post Ad
                </Button>
              </Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">My account</Link>
                  {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Admin panel</Link>}
                  <Button variant="outline" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }}>Sign out</Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Sign in</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
