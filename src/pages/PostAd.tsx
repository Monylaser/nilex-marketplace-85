import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ImagePlus, Check } from "lucide-react";
import { toast } from "sonner";

const PostAd = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Your ad has been posted!");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex flex-col items-center justify-center py-32 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full gradient-gold"
          >
            <Check className="h-10 w-10 text-accent-foreground" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-foreground">Ad Posted Successfully!</h1>
          <p className="mt-3 text-muted-foreground">Your listing is now live on Nilex.</p>
          <Button variant="gold" className="mt-8" onClick={() => setSubmitted(false)}>
            Post Another Ad
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Post Your Ad
          </h1>
          <p className="mt-2 text-muted-foreground">
            Reach millions of buyers across Egypt
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Ad Title</Label>
              <Input id="title" placeholder="e.g. BMW X5 2023 - Low Mileage" required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cars">Cars</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cairo">Cairo</SelectItem>
                    <SelectItem value="alexandria">Alexandria</SelectItem>
                    <SelectItem value="giza">Giza</SelectItem>
                    <SelectItem value="sharm">Sharm El Sheikh</SelectItem>
                    <SelectItem value="hurghada">Hurghada</SelectItem>
                    <SelectItem value="mansoura">Mansoura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (EGP)</Label>
              <Input id="price" type="number" placeholder="Enter price in Egyptian Pounds" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your item in detail — condition, features, reason for selling..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="flex h-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/50 text-muted-foreground transition hover:border-gold hover:bg-secondary">
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Click to upload photos</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="e.g. 01012345678" required />
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full">
              Publish Ad
            </Button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PostAd;
