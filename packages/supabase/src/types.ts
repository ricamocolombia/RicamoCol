// Tipos de la base de datos, escritos a mano a partir de
// supabase/migrations/0001_init.sql (no hay Personal Access Token de
// Supabase todavia para generarlos con el CLI -- ver el backlog en
// vault/Ricamo/02 Pendientes/Backlog.md). Si en algun momento se genera con
// `pnpm dlx supabase gen types typescript --project-id <id> --schema public`,
// ese resultado reemplaza este archivo completo.
//
// Mantener sincronizado a mano con el .sql mientras tanto: toda migracion
// nueva que agregue/cambie una columna debe reflejarse aqui tambien.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;
type DateOnly = string;
type Uuid = string;

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: Uuid;
          full_name: string;
          phone: string | null;
          email: string | null;
          instagram_handle: string | null;
          city: string | null;
          id_number: string | null;
          address: string | null;
          neighborhood: string | null;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          instagram_handle?: string | null;
          city?: string | null;
          id_number?: string | null;
          address?: string | null;
          neighborhood?: string | null;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };

      marketing_campaigns: {
        Row: {
          id: Uuid;
          name: string;
          subject: string;
          body: string;
          segment: "todos" | "nuevos" | "recurrentes" | "inactivos";
          status: "borrador" | "enviada" | "fallida";
          recipients_count: number | null;
          sent_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          subject: string;
          body: string;
          segment?: "todos" | "nuevos" | "recurrentes" | "inactivos";
          status?: "borrador" | "enviada" | "fallida";
          recipients_count?: number | null;
          sent_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["marketing_campaigns"]["Insert"]
        >;
        Relationships: [];
      };

      suppliers: {
        Row: {
          id: Uuid;
          name: string;
          type: "maquiladora" | "prendas" | "insumos" | "otro";
          contact_name: string | null;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          type: "maquiladora" | "prendas" | "insumos" | "otro";
          contact_name?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
        Relationships: [];
      };

      designs: {
        Row: {
          id: Uuid;
          name: string;
          technique: "bordado" | "estampado";
          status:
            | "borrador"
            | "enviado_aprobacion"
            | "aprobado"
            | "enviado_maquiladora"
            | "archivado";
          customer_id: Uuid | null;
          image_url: string | null;
          notes: string | null;
          published_to_ecommerce: boolean;
          published_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          technique: "bordado" | "estampado";
          status?:
            | "borrador"
            | "enviado_aprobacion"
            | "aprobado"
            | "enviado_maquiladora"
            | "archivado";
          customer_id?: Uuid | null;
          image_url?: string | null;
          notes?: string | null;
          published_to_ecommerce?: boolean;
          published_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["designs"]["Insert"]>;
        Relationships: [];
      };

      design_requests: {
        Row: {
          id: Uuid;
          customer_id: Uuid | null;
          garment_type: "camiseta" | "buzo";
          technique: "bordado" | "estampado";
          size: string | null;
          quantity: number;
          reference_notes: string | null;
          reference_image_url: string | null;
          status:
            | "nuevo"
            | "contactado_whatsapp"
            | "convertido_en_venta"
            | "descartado";
          design_id: Uuid | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          customer_id?: Uuid | null;
          garment_type: "camiseta" | "buzo";
          technique: "bordado" | "estampado";
          size?: string | null;
          quantity?: number;
          reference_notes?: string | null;
          reference_image_url?: string | null;
          status?:
            | "nuevo"
            | "contactado_whatsapp"
            | "convertido_en_venta"
            | "descartado";
          design_id?: Uuid | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["design_requests"]["Insert"]
        >;
        Relationships: [];
      };

      products: {
        Row: {
          id: Uuid;
          design_id: Uuid | null;
          name: string;
          slug: string;
          description: string | null;
          garment_type: "camiseta" | "buzo";
          technique: "bordado" | "estampado";
          base_price_cop: number;
          is_published: boolean;
          collection_id: Uuid | null;
          is_featured: boolean;
          is_bestseller: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          design_id?: Uuid | null;
          name: string;
          slug: string;
          description?: string | null;
          garment_type: "camiseta" | "buzo";
          technique: "bordado" | "estampado";
          base_price_cop: number;
          is_published?: boolean;
          collection_id?: Uuid | null;
          is_featured?: boolean;
          is_bestseller?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };

      design_images: {
        Row: {
          id: Uuid;
          design_id: Uuid;
          image_url: string;
          sort_order: number;
          is_cover: boolean;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          design_id: Uuid;
          image_url: string;
          sort_order?: number;
          is_cover?: boolean;
          created_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["design_images"]["Insert"]
        >;
        Relationships: [];
      };

      collections: {
        Row: {
          id: Uuid;
          name: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          slug: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["collections"]["Insert"]
        >;
        Relationships: [];
      };

      gift_segments: {
        Row: {
          id: Uuid;
          name: string;
          slug: string;
          is_active: boolean;
          sort_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          slug: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["gift_segments"]["Insert"]
        >;
        Relationships: [];
      };

      product_gift_segments: {
        Row: {
          product_id: Uuid;
          gift_segment_id: Uuid;
        };
        Insert: {
          product_id: Uuid;
          gift_segment_id: Uuid;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_gift_segments"]["Insert"]
        >;
        Relationships: [];
      };

      product_variants: {
        Row: {
          id: Uuid;
          product_id: Uuid;
          size: string;
          color: string | null;
          sku: string | null;
          price_cop: number;
          stock_quantity: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          product_id: Uuid;
          size: string;
          color?: string | null;
          sku?: string | null;
          price_cop: number;
          stock_quantity?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_variants"]["Insert"]
        >;
        Relationships: [];
      };

      inventory_items: {
        Row: {
          id: Uuid;
          name: string;
          garment_type: string;
          size: string | null;
          color: string | null;
          supplier_id: Uuid | null;
          warehouse_id: Uuid | null;
          alert_enabled: boolean;
          quantity_on_hand: number;
          reorder_level: number;
          unit_cost_cop: number | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          garment_type: string;
          size?: string | null;
          color?: string | null;
          supplier_id?: Uuid | null;
          warehouse_id?: Uuid | null;
          alert_enabled?: boolean;
          quantity_on_hand?: number;
          reorder_level?: number;
          unit_cost_cop?: number | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["inventory_items"]["Insert"]
        >;
        Relationships: [];
      };

      warehouses: {
        Row: {
          id: Uuid;
          name: string;
          supplier_id: Uuid | null;
          is_active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          supplier_id?: Uuid | null;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["warehouses"]["Insert"]>;
        Relationships: [];
      };

      app_settings: {
        Row: {
          key: string;
          value: string | null;
          updated_at: Timestamp;
        };
        Insert: {
          key: string;
          value?: string | null;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
        Relationships: [];
      };

      inventory_movements: {
        Row: {
          id: Uuid;
          inventory_item_id: Uuid;
          movement_type: "entrada_compra" | "salida_produccion" | "ajuste";
          quantity: number;
          reference_purchase_id: Uuid | null;
          reference_order_id: Uuid | null;
          notes: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          inventory_item_id: Uuid;
          movement_type: "entrada_compra" | "salida_produccion" | "ajuste";
          quantity: number;
          reference_purchase_id?: Uuid | null;
          reference_order_id?: Uuid | null;
          notes?: string | null;
          created_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["inventory_movements"]["Insert"]
        >;
        Relationships: [];
      };

      bank_accounts: {
        Row: {
          id: Uuid;
          name: string;
          bank_name: string | null;
          account_type:
            | "ahorros"
            | "corriente"
            | "billetera_digital"
            | "efectivo"
            | null;
          is_active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          bank_name?: string | null;
          account_type?:
            | "ahorros"
            | "corriente"
            | "billetera_digital"
            | "efectivo"
            | null;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["bank_accounts"]["Insert"]
        >;
        Relationships: [];
      };

      transactions: {
        Row: {
          id: Uuid;
          bank_account_id: Uuid;
          type: "ingreso" | "salida";
          category: string;
          amount_cop: number;
          description: string | null;
          reference_order_id: Uuid | null;
          reference_purchase_id: Uuid | null;
          occurred_at: Timestamp;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          bank_account_id: Uuid;
          type: "ingreso" | "salida";
          category: string;
          amount_cop: number;
          description?: string | null;
          reference_order_id?: Uuid | null;
          reference_purchase_id?: Uuid | null;
          occurred_at?: Timestamp;
          created_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["transactions"]["Insert"]
        >;
        Relationships: [];
      };

      couriers: {
        Row: {
          id: Uuid;
          name: string;
          phone: string | null;
          is_active: boolean;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          name: string;
          phone?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["couriers"]["Insert"]>;
        Relationships: [];
      };

      orders: {
        Row: {
          id: Uuid;
          customer_id: Uuid | null;
          source: "web_catalogo" | "web_personalizado" | "whatsapp" | "manual";
          status:
            | "pendiente"
            | "confirmado"
            | "en_produccion"
            | "enviado"
            | "entregado"
            | "cancelado";
          design_id: Uuid | null;
          total_cop: number;
          payment_status:
            | "pendiente"
            | "anticipo_pagado"
            | "pagado"
            | "reembolsado";
          payment_method: string | null;
          courier_id: Uuid | null;
          shipping_type: "nacional" | "local" | null;
          shipping_payment_status: "contraentrega" | "pagado" | null;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          customer_id?: Uuid | null;
          source: "web_catalogo" | "web_personalizado" | "whatsapp" | "manual";
          status?:
            | "pendiente"
            | "confirmado"
            | "en_produccion"
            | "enviado"
            | "entregado"
            | "cancelado";
          design_id?: Uuid | null;
          total_cop?: number;
          payment_status?:
            | "pendiente"
            | "anticipo_pagado"
            | "pagado"
            | "reembolsado";
          payment_method?: string | null;
          courier_id?: Uuid | null;
          shipping_type?: "nacional" | "local" | null;
          shipping_payment_status?: "contraentrega" | "pagado" | null;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };

      order_items: {
        Row: {
          id: Uuid;
          order_id: Uuid;
          product_variant_id: Uuid | null;
          design_id: Uuid | null;
          description: string | null;
          quantity: number;
          unit_price_cop: number;
          garment_type: string | null;
          design_category: string | null;
          color: string | null;
          size: string | null;
          technique: "bordado" | "estampado" | null;
          print_size:
            | "punto_corazon"
            | "media_carta"
            | "carta"
            | "oficio"
            | "tabloide"
            | null;
          cost_cop: number | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          order_id: Uuid;
          product_variant_id?: Uuid | null;
          design_id?: Uuid | null;
          description?: string | null;
          quantity?: number;
          unit_price_cop: number;
          garment_type?: string | null;
          design_category?: string | null;
          color?: string | null;
          size?: string | null;
          technique?: "bordado" | "estampado" | null;
          print_size?:
            | "punto_corazon"
            | "media_carta"
            | "carta"
            | "oficio"
            | "tabloide"
            | null;
          cost_cop?: number | null;
          created_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["order_items"]["Insert"]
        >;
        Relationships: [];
      };

      order_item_decorations: {
        Row: {
          id: Uuid;
          order_item_id: Uuid;
          print_size:
            | "punto_corazon"
            | "media_carta"
            | "carta"
            | "oficio"
            | "tabloide"
            | null;
          cost_cop: number;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          order_item_id: Uuid;
          print_size?:
            | "punto_corazon"
            | "media_carta"
            | "carta"
            | "oficio"
            | "tabloide"
            | null;
          cost_cop: number;
          created_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["order_item_decorations"]["Insert"]
        >;
        Relationships: [];
      };

      deliveries: {
        Row: {
          id: Uuid;
          order_id: Uuid;
          courier_id: Uuid | null;
          address: string | null;
          status: "pendiente" | "en_camino" | "entregado" | "fallido";
          delivered_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          order_id: Uuid;
          courier_id?: Uuid | null;
          address?: string | null;
          status?: "pendiente" | "en_camino" | "entregado" | "fallido";
          delivered_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["deliveries"]["Insert"]>;
        Relationships: [];
      };

      purchases: {
        Row: {
          id: Uuid;
          supplier_id: Uuid;
          invoice_number: string | null;
          status: "pendiente" | "recibida" | "cancelada";
          total_cop: number;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          supplier_id: Uuid;
          invoice_number?: string | null;
          status?: "pendiente" | "recibida" | "cancelada";
          total_cop?: number;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["purchases"]["Insert"]>;
        Relationships: [];
      };

      purchase_items: {
        Row: {
          id: Uuid;
          purchase_id: Uuid;
          inventory_item_id: Uuid | null;
          description: string | null;
          quantity: number;
          unit_cost_cop: number;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          purchase_id: Uuid;
          inventory_item_id?: Uuid | null;
          description?: string | null;
          quantity?: number;
          unit_cost_cop: number;
          created_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["purchase_items"]["Insert"]
        >;
        Relationships: [];
      };

      accounts_receivable: {
        Row: {
          id: Uuid;
          customer_id: Uuid | null;
          order_id: Uuid | null;
          amount_cop: number;
          due_date: DateOnly | null;
          status: "pendiente" | "pagado" | "vencido" | "anulado";
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          customer_id?: Uuid | null;
          order_id?: Uuid | null;
          amount_cop: number;
          due_date?: DateOnly | null;
          status?: "pendiente" | "pagado" | "vencido" | "anulado";
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["accounts_receivable"]["Insert"]
        >;
        Relationships: [];
      };

      accounts_payable: {
        Row: {
          id: Uuid;
          supplier_id: Uuid | null;
          purchase_id: Uuid | null;
          order_id: Uuid | null;
          amount_cop: number;
          due_date: DateOnly | null;
          status: "pendiente" | "pagado" | "vencido" | "anulado";
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          supplier_id?: Uuid | null;
          purchase_id?: Uuid | null;
          order_id?: Uuid | null;
          amount_cop: number;
          due_date?: DateOnly | null;
          status?: "pendiente" | "pagado" | "vencido" | "anulado";
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["accounts_payable"]["Insert"]
        >;
        Relationships: [];
      };

      print_size_prices: {
        Row: {
          print_size:
            | "punto_corazon"
            | "media_carta"
            | "carta"
            | "oficio"
            | "tabloide";
          cost_cop: number | null;
          updated_at: Timestamp;
        };
        Insert: {
          print_size:
            | "punto_corazon"
            | "media_carta"
            | "carta"
            | "oficio"
            | "tabloide";
          cost_cop?: number | null;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["print_size_prices"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
