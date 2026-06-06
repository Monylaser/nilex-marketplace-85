import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: number;
  title: string;
  image: string;
  link: string | null;
  position: string;
}

const Column = ({ items }: { items: Banner[] }) => (
  <div className="flex flex-col gap-4">
    {items.map((b) => {
      const content = (
        <img
          src={b.image}
          alt={b.title}
          className="w-full rounded-xl border border-border object-cover shadow-sm transition hover:shadow-premium"
        />
      );
      return (
        <div key={b.id}>
          {b.link ? (
            <a href={b.link} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          ) : (
            content
          )}
        </div>
      );
    })}
  </div>
);

const SideAdColumns = ({ children }: { children: React.ReactNode }) => {
  const [left, setLeft] = useState<Banner[]>([]);
  const [right, setRight] = useState<Banner[]>([]);

  useEffect(() => {
    supabase
      .from("banners")
      .select("id,title,image,link,position")
      .eq("is_active", true)
      .in("position", ["home_left", "home_right"])
      .order("sort_order")
      .then(({ data }) => {
        const all = (data || []) as Banner[];
        setLeft(all.filter((b) => b.position === "home_left"));
        setRight(all.filter((b) => b.position === "home_right"));
      });
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-4 xl:grid-cols-[180px_minmax(0,1fr)_180px]">
      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <Column items={left} />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <Column items={right} />
        </div>
      </aside>
    </div>
  );
};

export default SideAdColumns;
