import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, X, Upload, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";

export interface AiResult {
  title: string;
  description: string;
  category?: string;
  condition: "new" | "used" | "refurbished";
  price_min: number;
  price_max: number;
  key_features?: string[];
}

interface Props {
  onApply: (r: AiResult) => void;
  categoriesHint?: string;
}

const MAX_IMAGES = 5;

const AiAdAssistant = ({ onApply, categoriesHint }: Props) => {
  const { user } = useAuth();
  const [keywords, setKeywords] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const slots = MAX_IMAGES - images.length;
    if (slots <= 0) return toast.error(`Max ${MAX_IMAGES} images`);
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, slots)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} > 5MB, skipped`);
          continue;
        }
        const path = `${user.id}/ai/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("chat-images").upload(path, file, {
          contentType: file.type,
        });
        if (error) {
          toast.error(error.message);
          continue;
        }
        const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setImages((p) => [...p, ...uploaded]);
    } finally {
      setUploading(false);
    }
  };

  const generate = async () => {
    if (!keywords.trim() && images.length === 0) {
      return toast.error("Add keywords or images first");
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-ad", {
        body: { keywords, images, categoriesHint },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const r = data as AiResult & { remaining?: number };
      setResult(r);
      if (typeof r.remaining === "number") setRemaining(r.remaining);
      toast.success("AI generated your ad ✨");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const accept = () => {
    if (!result) return;
    onApply(result);
    toast.success("Applied to form");
  };

  return (
    <Card className="border-accent/40 bg-gradient-to-br from-accent/5 to-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <h3 className="font-display text-lg font-semibold">AI Assistant</h3>
        {remaining !== null && (
          <span className="ml-auto text-xs text-muted-foreground">{remaining}/10 left today</span>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Keywords</Label>
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. modern, spacious, new, low mileage"
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label>Images (up to {MAX_IMAGES})</Label>
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-md border">
                <img src={url} alt={`upload ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((p) => p.filter((u) => u !== url))}
                  className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-muted/50">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <span className="text-xs">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>

        <Button type="button" variant="gold" onClick={generate} disabled={busy || uploading} className="w-full">
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing… (5–10s)
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3 rounded-md border bg-background/60 p-3">
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Suggested Title</div>
              <div className="font-medium" dir="auto">{result.title}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Description</div>
              <p className="whitespace-pre-wrap text-sm" dir="auto">{result.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Condition: </span>
                <span className="font-medium">{result.condition}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Price: </span>
                <span className="font-medium">
                  {result.price_min.toLocaleString()}–{result.price_max.toLocaleString()} EGP
                </span>
              </div>
              {result.category && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Category: </span>
                  <span className="font-medium">{result.category}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="gold" onClick={accept} className="flex-1">
                <Check className="mr-1 h-4 w-4" /> Use this
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={generate} disabled={busy}>
                <RefreshCw className="mr-1 h-4 w-4" /> Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AiAdAssistant;
