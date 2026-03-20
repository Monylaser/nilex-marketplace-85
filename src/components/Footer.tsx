import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-primary text-primary-foreground">
    <div className="container py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-xl font-bold text-gradient-gold">Nilex</h3>
          <p className="mt-2 text-sm text-primary-foreground/60">
            Egypt's trusted marketplace for buying and selling.
          </p>
        </div>
        <div>
          <h4 className="font-semibold">Categories</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/60">
            <li><Link to="/cars" className="hover:text-primary-foreground transition">Cars</Link></li>
            <li><Link to="/real-estate" className="hover:text-primary-foreground transition">Real Estate</Link></li>
            <li><Link to="/electronics" className="hover:text-primary-foreground transition">Electronics</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/60">
            <li><span className="hover:text-primary-foreground transition cursor-pointer">About</span></li>
            <li><span className="hover:text-primary-foreground transition cursor-pointer">Contact</span></li>
            <li><span className="hover:text-primary-foreground transition cursor-pointer">Terms</span></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Cities</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/60">
            <li>Cairo</li>
            <li>Alexandria</li>
            <li>Giza</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/40">
        © 2026 Nilex. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
