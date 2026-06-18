import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
};

export type Seller = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  status: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  location: string | null;
  available: boolean;
  featured: boolean;
  created_at: string;
  category_id: string | null;
  seller_id: string | null;
  seller?: Seller | null;
  category?: Category | null;
};

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data as Category[];
  },
});

const productSelect = `
  id, title, description, price, images, contact_phone, contact_whatsapp,
  contact_email, location, available, featured, created_at, category_id, seller_id,
  seller:sellers(id, full_name, email, phone, avatar_url, bio, verified, status),
  category:categories(id, name, slug, icon, color, sort_order)
`;

export const featuredProductsQuery = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(productSelect)
      .eq("available", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
});

export const productsListQuery = (params: { category?: string; search?: string } = {}) =>
  queryOptions({
    queryKey: ["products", "list", params],
    queryFn: async (): Promise<Product[]> => {
      let q = supabase
        .from("products")
        .select(productSelect)
        .eq("available", true)
        .order("created_at", { ascending: false })
        .limit(40);
      if (params.search) q = q.ilike("title", `%${params.search}%`);
      if (params.category && params.category !== "all") {
        // join filter: use category.slug
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", params.category)
          .maybeSingle();
        if (cat?.id) q = q.eq("category_id", cat.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });

export const productByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["products", "detail", id],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(productSelect)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Product | null;
    },
  });

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
