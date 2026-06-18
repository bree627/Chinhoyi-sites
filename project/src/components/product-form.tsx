import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const productSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  price: z.number().min(0).max(1_000_000),
  category_id: z.string().uuid().nullable(),
  images: z.array(z.string().url()).min(1).max(6),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  contact_phone: z.string().trim().max(30).optional().or(z.literal("")),
  contact_whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  contact_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  available: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

type Category = { id: string; name: string };

export function ProductForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<ProductFormValues>;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [imagesText, setImagesText] = useState((initial?.images ?? []).join("\n"));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [phone, setPhone] = useState(initial?.contact_phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.contact_whatsapp ?? "");
  const [email, setEmail] = useState(initial?.contact_email ?? "");
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("sort_order").then(({ data }) => {
      setCategories((data as Category[] | null) ?? []);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const images = imagesText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const parsed = productSchema.safeParse({
      title,
      description,
      price: Number(price),
      category_id: categoryId || null,
      images,
      location,
      contact_phone: phone,
      contact_whatsapp: whatsapp,
      contact_email: email,
      available,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(parsed.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-3xl p-6 sm:p-7 space-y-5">
      <FormField label="Title">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
          placeholder="What are you selling?"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Price (USD)">
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
            placeholder="49"
          />
        </FormField>
        <FormField label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-11 px-3 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Description" hint="10–2000 characters">
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={2000}
          className="w-full px-4 py-3 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm resize-none"
          placeholder="Tell buyers about the condition, what's included, why you're selling..."
        />
      </FormField>

      <FormField label="Image URLs" hint="One per line, up to 6. Paste public image URLs.">
        <textarea
          required
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm font-mono text-xs resize-none"
          placeholder="https://example.com/photo1.jpg"
        />
      </FormField>

      <FormField label="Location">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={120}
          className="w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
          placeholder="Lisbon, Portugal"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="WhatsApp">
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            maxLength={30}
            className="w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
            placeholder="+1555..."
          />
        </FormField>
        <FormField label="Phone">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            className="w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
            placeholder="+1555..."
          />
        </FormField>
        <FormField label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            className="w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
            placeholder="you@..."
          />
        </FormField>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="size-4 accent-brand"
        />
        <span className="text-sm">Available — show this product in the marketplace</span>
      </label>

      {error && <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>}

      <button
        type="submit"
        disabled={busy}
        className="w-full h-12 rounded-2xl bg-brand text-brand-foreground font-bold text-sm shadow-lg shadow-brand/20 inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}
