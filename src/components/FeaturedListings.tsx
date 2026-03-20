import { motion } from "framer-motion";
import { MapPin, Heart } from "lucide-react";
import categoryCars from "@/assets/category-cars.jpg";
import categoryRealestate from "@/assets/category-realestate.jpg";

const listings = [
  { id: 1, title: "BMW X5 2023 - Excellent Condition", price: "2,850,000 EGP", location: "New Cairo", category: "Cars", image: categoryCars },
  { id: 2, title: "3BR Apartment in Zamalek", price: "4,500,000 EGP", location: "Zamalek, Cairo", category: "Real Estate", image: categoryRealestate },
  { id: 3, title: "Mercedes C200 2022", price: "1,950,000 EGP", location: "6th of October", category: "Cars", image: categoryCars },
  { id: 4, title: "Penthouse with Nile View", price: "12,000,000 EGP", location: "Maadi, Cairo", category: "Real Estate", image: categoryRealestate },
  { id: 5, title: "Toyota Corolla 2024", price: "1,200,000 EGP", location: "Heliopolis", category: "Cars", image: categoryCars },
  { id: 6, title: "Villa in North Coast", price: "8,500,000 EGP", location: "North Coast", category: "Real Estate", image: categoryRealestate },
];

const FeaturedListings = () => {
  return (
    <section className="container py-16">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Featured Ads
          </h2>
          <p className="mt-2 text-muted-foreground">Hand-picked listings from across Egypt</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, i) => (
          <motion.article
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={listing.image}
                alt={listing.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition hover:text-terracotta">
                <Heart className="h-4 w-4" />
              </button>
              <span className="absolute left-3 top-3 rounded-md bg-primary/80 px-2.5 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                {listing.category}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground line-clamp-1">{listing.title}</h3>
              <p className="mt-1 text-lg font-bold text-gradient-gold">{listing.price}</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {listing.location}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default FeaturedListings;
