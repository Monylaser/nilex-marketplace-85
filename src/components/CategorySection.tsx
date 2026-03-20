import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Building2, Smartphone, Sofa } from "lucide-react";
import categoryCars from "@/assets/category-cars.jpg";
import categoryRealestate from "@/assets/category-realestate.jpg";

const categories = [
  {
    name: "Cars",
    description: "New & used vehicles",
    icon: Car,
    image: categoryCars,
    link: "/cars",
    count: "12,400+",
  },
  {
    name: "Real Estate",
    description: "Apartments, villas & land",
    icon: Building2,
    image: categoryRealestate,
    link: "/real-estate",
    count: "8,200+",
  },
  {
    name: "Electronics",
    description: "Phones, laptops & more",
    icon: Smartphone,
    link: "/electronics",
    count: "15,800+",
  },
  {
    name: "Furniture",
    description: "Home & office",
    icon: Sofa,
    link: "/furniture",
    count: "4,600+",
  },
];

const CategorySection = () => {
  return (
    <section className="container py-16">
      <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
        Browse Categories
      </h2>
      <p className="mt-2 text-muted-foreground">
        Find what you need across Egypt's most popular categories
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={cat.link}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-xl hover:-translate-y-1"
            >
              {cat.image ? (
                <div className="h-40 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center bg-secondary">
                  <cat.icon className="h-16 w-16 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-gold">
                  <cat.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {cat.description} · {cat.count} ads
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
