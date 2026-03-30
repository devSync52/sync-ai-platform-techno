export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_integrations: {
        Row: {
          account_id: string | null
          created_at: string | null
          credentials: Json | null
          domain: string | null
          id: string
          is_default: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          name: string | null
          provider_id: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          credentials?: Json | null
          domain?: string | null
          id?: string
          is_default?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string | null
          provider_id?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          credentials?: Json | null
          domain?: string | null
          id?: string
          is_default?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string | null
          provider_id?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "account_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_integrations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      account_types: {
        Row: {
          description: string | null
          id: string
          key: string
          label: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          label: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by_user_id: string | null
          email: string | null
          extensiv_customer_id: string | null
          external_id: string | null
          facilities: Json | null
          id: string
          logo: string | null
          logo_main: string | null
          name: string
          parent_account_id: string | null
          phone: string | null
          pricing: boolean | null
          sellercloud_customer_id: string | null
          sellercloud_user_id: number | null
          shipping_markup_percent: number
          slug: string | null
          source: string | null
          state: string | null
          status: string | null
          tax_id: string | null
          template: string | null
          type_id: string | null
          updated_at: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string | null
          extensiv_customer_id?: string | null
          external_id?: string | null
          facilities?: Json | null
          id?: string
          logo?: string | null
          logo_main?: string | null
          name: string
          parent_account_id?: string | null
          phone?: string | null
          pricing?: boolean | null
          sellercloud_customer_id?: string | null
          sellercloud_user_id?: number | null
          shipping_markup_percent?: number
          slug?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          template?: string | null
          type_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string | null
          extensiv_customer_id?: string | null
          external_id?: string | null
          facilities?: Json | null
          id?: string
          logo?: string | null
          logo_main?: string | null
          name?: string
          parent_account_id?: string | null
          phone?: string | null
          pricing?: boolean | null
          sellercloud_customer_id?: string | null
          sellercloud_user_id?: number | null
          shipping_markup_percent?: number
          slug?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          template?: string | null
          type_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "accounts_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "account_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      address: {
        Row: {
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json | null
          phone_number: string | null
          postal_code: string | null
          state_code: string | null
          state_name: string | null
          street_line1: string | null
          street_line2: string | null
          type: Database["public"]["Enums"]["address_type"] | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          phone_number?: string | null
          postal_code?: string | null
          state_code?: string | null
          state_name?: string | null
          street_line1?: string | null
          street_line2?: string | null
          type?: Database["public"]["Enums"]["address_type"] | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          phone_number?: string | null
          postal_code?: string | null
          state_code?: string | null
          state_name?: string | null
          street_line1?: string | null
          street_line2?: string | null
          type?: Database["public"]["Enums"]["address_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_chat_logs: {
        Row: {
          account_id: string | null
          answer: string | null
          id: string
          metadata: Json | null
          question: string | null
          role: string | null
          session_id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          answer?: string | null
          id?: string
          metadata?: Json | null
          question?: string | null
          role?: string | null
          session_id: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          answer?: string | null
          id?: string
          metadata?: Json | null
          question?: string | null
          role?: string | null
          session_id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_logs: {
        Row: {
          account_id: string | null
          answer: string
          created_at: string | null
          id: string
          metadata: Json | null
          model: string | null
          question: string
          sql: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          answer: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          question: string
          sql?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          answer?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          question?: string
          sql?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "ai_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "ai_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_session_messages: {
        Row: {
          created_at: string | null
          id: string
          is_bot: boolean
          message: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_bot?: boolean
          message: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_bot?: boolean
          message?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          access_inventory: boolean | null
          access_orders: boolean | null
          access_sales: boolean | null
          account_id: string | null
          auto_reply_enabled: boolean | null
          created_at: string | null
          id: string
          max_tokens: number | null
          model: string | null
        }
        Insert: {
          access_inventory?: boolean | null
          access_orders?: boolean | null
          access_sales?: boolean | null
          account_id?: string | null
          auto_reply_enabled?: boolean | null
          created_at?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
        }
        Update: {
          access_inventory?: boolean | null
          access_orders?: boolean | null
          access_sales?: boolean | null
          account_id?: string | null
          auto_reply_enabled?: boolean | null
          created_at?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "ai_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "ai_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      billing_activity_events: {
        Row: {
          client_id: string
          created_at: string | null
          event_type: string
          external_id: string | null
          id: string
          meta: Json | null
          occurred_at: string
          quantity: number
          raw: Json | null
          source: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          meta?: Json | null
          occurred_at: string
          quantity: number
          raw?: Json | null
          source?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          meta?: Json | null
          occurred_at?: string
          quantity?: number
          raw?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      billing_invoice_lines: {
        Row: {
          amount: number
          calc_trace: Json | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string
          line_type: string
          quantity: number
          source_refs: Json | null
          unit: string | null
          unit_price: number
          warehouse_account_id: string | null
        }
        Insert: {
          amount: number
          calc_trace?: Json | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          line_type: string
          quantity: number
          source_refs?: Json | null
          unit?: string | null
          unit_price: number
          warehouse_account_id?: string | null
        }
        Update: {
          amount?: number
          calc_trace?: Json | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          line_type?: string
          quantity?: number
          source_refs?: Json | null
          unit?: string | null
          unit_price?: number
          warehouse_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_billing_reconciliation"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          client_id: string
          created_at: string | null
          currency: string
          delivered_at: string | null
          generated_at: string | null
          id: string
          meta: Json | null
          pdf_url: string | null
          period_end: string
          period_start: string
          status: string
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
          warehouse_account_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          currency?: string
          delivered_at?: string | null
          generated_at?: string | null
          id?: string
          meta?: Json | null
          pdf_url?: string | null
          period_end: string
          period_start: string
          status?: string
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          warehouse_account_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          currency?: string
          delivered_at?: string | null
          generated_at?: string | null
          id?: string
          meta?: Json | null
          pdf_url?: string | null
          period_end?: string
          period_start?: string
          status?: string
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          warehouse_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "billing_invoices_warehouse_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_warehouse_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "billing_invoices_warehouse_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_warehouse_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_warehouse_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "billing_invoices_warehouse_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      billing_rate_activity: {
        Row: {
          code: string
          id: string
          rate: number
          rate_card_id: string | null
          unit: string
        }
        Insert: {
          code: string
          id?: string
          rate: number
          rate_card_id?: string | null
          unit: string
        }
        Update: {
          code?: string
          id?: string
          rate?: number
          rate_card_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_rate_activity_rate_card_id_fkey"
            columns: ["rate_card_id"]
            isOneToOne: false
            referencedRelation: "billing_rate_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rate_cards: {
        Row: {
          account_id: string
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string | null
          version: number
        }
        Insert: {
          account_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          account_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      billing_rate_outbound_buckets: {
        Row: {
          id: string
          rate_card_id: string | null
          size_max_cft: number | null
          size_min_cft: number
        }
        Insert: {
          id?: string
          rate_card_id?: string | null
          size_max_cft?: number | null
          size_min_cft: number
        }
        Update: {
          id?: string
          rate_card_id?: string | null
          size_max_cft?: number | null
          size_min_cft?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_rate_outbound_buckets_rate_card_id_fkey"
            columns: ["rate_card_id"]
            isOneToOne: false
            referencedRelation: "billing_rate_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rate_outbound_tiers: {
        Row: {
          bucket_id: string | null
          channel: string | null
          id: string
          max_units: number | null
          rate_per_unit: number
          tier_order: number
        }
        Insert: {
          bucket_id?: string | null
          channel?: string | null
          id?: string
          max_units?: number | null
          rate_per_unit: number
          tier_order: number
        }
        Update: {
          bucket_id?: string | null
          channel?: string | null
          id?: string
          max_units?: number | null
          rate_per_unit?: number
          tier_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_rate_outbound_tiers_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "billing_rate_outbound_buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rate_storage_tiers: {
        Row: {
          id: string
          max_cft: number | null
          rate_card_id: string | null
          rate_per_cft: number
          tier_order: number
        }
        Insert: {
          id?: string
          max_cft?: number | null
          rate_card_id?: string | null
          rate_per_cft: number
          tier_order: number
        }
        Update: {
          id?: string
          max_cft?: number | null
          rate_card_id?: string | null
          rate_per_cft?: number
          tier_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_rate_storage_tiers_rate_card_id_fkey"
            columns: ["rate_card_id"]
            isOneToOne: false
            referencedRelation: "billing_rate_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_runs_log: {
        Row: {
          client_id: string
          created_at: string | null
          duration_ms: number | null
          error: string | null
          id: string
          line_count: number | null
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          line_count?: number | null
          period_end: string
          period_start: string
          status: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          line_count?: number | null
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: []
      }
      channel_marketplaces: {
        Row: {
          channel_id: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          marketplace_code: string
          marketplace_name: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          marketplace_code: string
          marketplace_name?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          marketplace_code?: string
          marketplace_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_marketplaces_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["channel_id"]
          },
          {
            foreignKeyName: "channel_marketplaces_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_marketplaces_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["channel_id"]
          },
        ]
      }
      channels: {
        Row: {
          account_id: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          country: string | null
          created_at: string | null
          email: string | null
          external_id: string | null
          id: string
          last_inventory_sync_at: string | null
          name: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["channel_source"] | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          account_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          external_id?: string | null
          id?: string
          last_inventory_sync_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["channel_source"] | null
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          account_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          external_id?: string | null
          id?: string
          last_inventory_sync_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["channel_source"] | null
          state?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "channels_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "channels_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      clients: {
        Row: {
          account_id: string | null
          corporate_name: string | null
          created_at: string | null
          ebay_user_id: string | null
          email: string | null
          email_cc: string | null
          external_id: string | null
          first_name: string | null
          id: string
          is_blacklisted: boolean | null
          is_wholesale_user: boolean | null
          last_name: string | null
          middle_name: string | null
          name: string | null
          phone: string | null
          provider_id: string | null
          source_id: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          corporate_name?: string | null
          created_at?: string | null
          ebay_user_id?: string | null
          email?: string | null
          email_cc?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: string
          is_blacklisted?: boolean | null
          is_wholesale_user?: boolean | null
          last_name?: string | null
          middle_name?: string | null
          name?: string | null
          phone?: string | null
          provider_id?: string | null
          source_id?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          corporate_name?: string | null
          created_at?: string | null
          ebay_user_id?: string | null
          email?: string | null
          email_cc?: string | null
          external_id?: string | null
          first_name?: string | null
          id?: string
          is_blacklisted?: boolean | null
          is_wholesale_user?: boolean | null
          last_name?: string | null
          middle_name?: string | null
          name?: string | null
          phone?: string | null
          provider_id?: string | null
          source_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_preferences: {
        Row: {
          cards_order: string[] | null
          updated_at: string | null
          user_id: string
          visible_cards: string[] | null
        }
        Insert: {
          cards_order?: string[] | null
          updated_at?: string | null
          user_id: string
          visible_cards?: string[] | null
        }
        Update: {
          cards_order?: string[] | null
          updated_at?: string | null
          user_id?: string
          visible_cards?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "confirmed_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_quotes: {
        Row: {
          account_id: string | null
          created_at: string | null
          destination: Json | null
          id: string
          origin: Json | null
          packages: Json | null
          services: Json | null
          total_freight: number | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          destination?: Json | null
          id?: string
          origin?: Json | null
          packages?: Json | null
          services?: Json | null
          total_freight?: number | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          destination?: Json | null
          id?: string
          origin?: Json | null
          packages?: Json | null
          services?: Json | null
          total_freight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      extensiv_inventory: {
        Row: {
          account_id: string
          channel_account_id: string
          external_id: string
          id: string
          last_updated_at: string | null
          quantity_available: number | null
          quantity_on_hand: number | null
          sku: string
        }
        Insert: {
          account_id: string
          channel_account_id: string
          external_id: string
          id?: string
          last_updated_at?: string | null
          quantity_available?: number | null
          quantity_on_hand?: number | null
          sku: string
        }
        Update: {
          account_id?: string
          channel_account_id?: string
          external_id?: string
          id?: string
          last_updated_at?: string | null
          quantity_available?: number | null
          quantity_on_hand?: number | null
          sku?: string
        }
        Relationships: []
      }
      extensiv_order_items: {
        Row: {
          created_at: string | null
          external_id: string | null
          fully_allocated: boolean | null
          id: number
          is_active: boolean
          last_seen_at: string | null
          order_id: number | null
          qty: number | null
          raw_data: Json | null
          sku: string | null
          sku_external_id: string | null
          unit_id: string | null
          unit_name: string | null
          weight_imperial: number | null
          weight_metric: number | null
        }
        Insert: {
          created_at?: string | null
          external_id?: string | null
          fully_allocated?: boolean | null
          id?: number
          is_active?: boolean
          last_seen_at?: string | null
          order_id?: number | null
          qty?: number | null
          raw_data?: Json | null
          sku?: string | null
          sku_external_id?: string | null
          unit_id?: string | null
          unit_name?: string | null
          weight_imperial?: number | null
          weight_metric?: number | null
        }
        Update: {
          created_at?: string | null
          external_id?: string | null
          fully_allocated?: boolean | null
          id?: number
          is_active?: boolean
          last_seen_at?: string | null
          order_id?: number | null
          qty?: number | null
          raw_data?: Json | null
          sku?: string | null
          sku_external_id?: string | null
          unit_id?: string | null
          unit_name?: string | null
          weight_imperial?: number | null
          weight_metric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ai_orders_unified_full"
            referencedColumns: ["extensiv_order_id"]
          },
          {
            foreignKeyName: "extensiv_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_only"
            referencedColumns: ["extensiv_order_pk"]
          },
          {
            foreignKeyName: "extensiv_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud"
            referencedColumns: ["extensiv_order_pk"]
          },
          {
            foreignKeyName: "extensiv_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud_1"
            referencedColumns: ["extensiv_order_pk"]
          },
          {
            foreignKeyName: "extensiv_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "extensiv_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "extensiv_orders_logistics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_extensiv_orders_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      extensiv_orders: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          channel_id: string | null
          created_at: string | null
          created_by_id: string | null
          created_by_name: string | null
          creation_date: string | null
          customer_external_id: string | null
          customer_name: string | null
          external_id: string
          facility_external_id: string | null
          facility_name: string | null
          id: number
          is_cod: boolean | null
          is_insurance: boolean | null
          last_event_name: string | null
          last_event_received_at: string | null
          last_event_type: string | null
          last_modified_by_id: string | null
          last_modified_by_name: string | null
          last_modified_date: string | null
          notes: string | null
          order_number: string | null
          process_date: string | null
          raw_data: Json | null
          source: string | null
          status: number | null
          status_closed: boolean | null
          status_fully_allocated: boolean | null
          total_volume: number | null
          total_weight: number | null
          tracking_number: string | null
        }
        Insert: {
          account_id?: string | null
          account_id_channel?: string | null
          channel_id?: string | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          creation_date?: string | null
          customer_external_id?: string | null
          customer_name?: string | null
          external_id: string
          facility_external_id?: string | null
          facility_name?: string | null
          id?: number
          is_cod?: boolean | null
          is_insurance?: boolean | null
          last_event_name?: string | null
          last_event_received_at?: string | null
          last_event_type?: string | null
          last_modified_by_id?: string | null
          last_modified_by_name?: string | null
          last_modified_date?: string | null
          notes?: string | null
          order_number?: string | null
          process_date?: string | null
          raw_data?: Json | null
          source?: string | null
          status?: number | null
          status_closed?: boolean | null
          status_fully_allocated?: boolean | null
          total_volume?: number | null
          total_weight?: number | null
          tracking_number?: string | null
        }
        Update: {
          account_id?: string | null
          account_id_channel?: string | null
          channel_id?: string | null
          created_at?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          creation_date?: string | null
          customer_external_id?: string | null
          customer_name?: string | null
          external_id?: string
          facility_external_id?: string | null
          facility_name?: string | null
          id?: number
          is_cod?: boolean | null
          is_insurance?: boolean | null
          last_event_name?: string | null
          last_event_received_at?: string | null
          last_event_type?: string | null
          last_modified_by_id?: string | null
          last_modified_by_name?: string | null
          last_modified_date?: string | null
          notes?: string | null
          order_number?: string | null
          process_date?: string | null
          raw_data?: Json | null
          source?: string | null
          status?: number | null
          status_closed?: boolean | null
          status_fully_allocated?: boolean | null
          total_volume?: number | null
          total_weight?: number | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["channel_id"]
          },
          {
            foreignKeyName: "extensiv_orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["channel_id"]
          },
        ]
      }
      extensiv_products: {
        Row: {
          account_id: string
          channel_account_id: string
          description: string | null
          external_id: string
          height: number | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          length: number | null
          sku: string | null
          source: string | null
          upc: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          account_id: string
          channel_account_id: string
          description?: string | null
          external_id: string
          height?: number | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          length?: number | null
          sku?: string | null
          source?: string | null
          upc?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          account_id?: string
          channel_account_id?: string
          description?: string | null
          external_id?: string
          height?: number | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          length?: number | null
          sku?: string | null
          source?: string | null
          upc?: string | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      extensiv_products_n: {
        Row: {
          available: number | null
          carton_units: number | null
          client_account_id: string
          company_name: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          extensiv_customer_id: number
          has_storage_rates: boolean | null
          id: string
          item_id: number
          last_synced_at: string | null
          on_hold: number | null
          parent_account_id: string
          pkg_height_in: number | null
          pkg_length_in: number | null
          pkg_weight_lb: number | null
          pkg_width_in: number | null
          price: number | null
          quantity_available: number | null
          raw: Json | null
          sku: string
          track_serial: boolean | null
          uom: string | null
          upc: string | null
          updated_at: string | null
          volume_cuft: number | null
          warehouse_name: string | null
        }
        Insert: {
          available?: number | null
          carton_units?: number | null
          client_account_id: string
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          extensiv_customer_id: number
          has_storage_rates?: boolean | null
          id?: string
          item_id: number
          last_synced_at?: string | null
          on_hold?: number | null
          parent_account_id: string
          pkg_height_in?: number | null
          pkg_length_in?: number | null
          pkg_weight_lb?: number | null
          pkg_width_in?: number | null
          price?: number | null
          quantity_available?: number | null
          raw?: Json | null
          sku: string
          track_serial?: boolean | null
          uom?: string | null
          upc?: string | null
          updated_at?: string | null
          volume_cuft?: number | null
          warehouse_name?: string | null
        }
        Update: {
          available?: number | null
          carton_units?: number | null
          client_account_id?: string
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          extensiv_customer_id?: number
          has_storage_rates?: boolean | null
          id?: string
          item_id?: number
          last_synced_at?: string | null
          on_hold?: number | null
          parent_account_id?: string
          pkg_height_in?: number | null
          pkg_length_in?: number | null
          pkg_weight_lb?: number | null
          pkg_width_in?: number | null
          price?: number | null
          quantity_available?: number | null
          raw?: Json | null
          sku?: string
          track_serial?: boolean | null
          uom?: string | null
          upc?: string | null
          updated_at?: string | null
          volume_cuft?: number | null
          warehouse_name?: string | null
        }
        Relationships: []
      }
      extensiv_products_sync_cursor: {
        Row: {
          client_account_id: string
          completed: boolean
          created_at: string | null
          extensiv_customer_id: number | null
          id: string
          last_synced_at: string | null
          next_page: number
          parent_account_id: string
          updated_at: string | null
        }
        Insert: {
          client_account_id: string
          completed?: boolean
          created_at?: string | null
          extensiv_customer_id?: number | null
          id?: string
          last_synced_at?: string | null
          next_page?: number
          parent_account_id: string
          updated_at?: string | null
        }
        Update: {
          client_account_id?: string
          completed?: boolean
          created_at?: string | null
          extensiv_customer_id?: number | null
          id?: string
          last_synced_at?: string | null
          next_page?: number
          parent_account_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      extensiv_sync_state: {
        Row: {
          account_id: string
          cursor_last_modified: string | null
          entity: string
          updated_at: string
        }
        Insert: {
          account_id: string
          cursor_last_modified?: string | null
          entity: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          cursor_last_modified?: string | null
          entity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      extensiv_webhook_events: {
        Row: {
          account_id: string
          channel_id: string | null
          event_hash: string
          event_name: string
          headers: Json | null
          id: number
          payload: Json
          processed_at: string | null
          processing_error: string | null
          raw_body: string | null
          received_at: string
          resource_external_id: string | null
          resource_type: string
        }
        Insert: {
          account_id: string
          channel_id?: string | null
          event_hash: string
          event_name: string
          headers?: Json | null
          id?: number
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          raw_body?: string | null
          received_at?: string
          resource_external_id?: string | null
          resource_type: string
        }
        Update: {
          account_id?: string
          channel_id?: string | null
          event_hash?: string
          event_name?: string
          headers?: Json | null
          id?: number
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          raw_body?: string | null
          received_at?: string
          resource_external_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_webhook_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_webhook_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_webhook_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_webhook_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_webhook_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_webhook_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_webhook_events_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["channel_id"]
          },
          {
            foreignKeyName: "extensiv_webhook_events_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_webhook_events_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["channel_id"]
          },
        ]
      }
      extensiv_webhook_tokens: {
        Row: {
          account_id: string
          created_at: string
          id: number
          is_enabled: boolean
          rotated_at: string | null
          token_hash: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: number
          is_enabled?: boolean
          rotated_at?: string | null
          token_hash: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: number
          is_enabled?: boolean
          rotated_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_webhook_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_webhook_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_webhook_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_webhook_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_webhook_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_webhook_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_company_account_map: {
        Row: {
          client_account_id: string
          company_id: number
          id: string
          integration: string
          warehouse_account_id: string
        }
        Insert: {
          client_account_id: string
          company_id: number
          id?: string
          integration: string
          warehouse_account_id: string
        }
        Update: {
          client_account_id?: string
          company_id?: number
          id?: string
          integration?: string
          warehouse_account_id?: string
        }
        Relationships: []
      }
      integration_tokens: {
        Row: {
          access_token: string
          account_id: string
          created_at: string
          expires_at: string
          id: string
          provider: string
          updated_at: string
        }
        Insert: {
          access_token: string
          account_id: string
          created_at?: string
          expires_at: string
          id?: string
          provider: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          account_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          body: Json | null
          content_type: string | null
          created_at: string | null
          end_point: string | null
          headers: Json | null
          id: string
          is_active: boolean
          name: string
          orders: boolean
          provider_icon: string | null
          slug: string | null
          updated_at: string | null
          verification_path: string | null
        }
        Insert: {
          body?: Json | null
          content_type?: string | null
          created_at?: string | null
          end_point?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          orders?: boolean
          provider_icon?: string | null
          slug?: string | null
          updated_at?: string | null
          verification_path?: string | null
        }
        Update: {
          body?: Json | null
          content_type?: string | null
          created_at?: string | null
          end_point?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          orders?: boolean
          provider_icon?: string | null
          slug?: string | null
          updated_at?: string | null
          verification_path?: string | null
        }
        Relationships: []
      }
      inventory_movement_reason_map: {
        Row: {
          direction: string
          reason: Database["public"]["Enums"]["inventory_movement_reason"]
        }
        Insert: {
          direction: string
          reason: Database["public"]["Enums"]["inventory_movement_reason"]
        }
        Update: {
          direction?: string
          reason?: Database["public"]["Enums"]["inventory_movement_reason"]
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          account_id: string
          client_account_id: string | null
          company_id: number | null
          created_at: string
          direction: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          occurred_at: string
          product_id: string | null
          qty_available_after: number | null
          qty_change: number
          qty_physical_after: number | null
          reason: Database["public"]["Enums"]["inventory_movement_reason"]
          sku: string
          source: string
          warehouse_account_id: string | null
          warehouse_name: string | null
        }
        Insert: {
          account_id: string
          client_account_id?: string | null
          company_id?: number | null
          created_at?: string
          direction?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          occurred_at?: string
          product_id?: string | null
          qty_available_after?: number | null
          qty_change: number
          qty_physical_after?: number | null
          reason: Database["public"]["Enums"]["inventory_movement_reason"]
          sku: string
          source: string
          warehouse_account_id?: string | null
          warehouse_name?: string | null
        }
        Update: {
          account_id?: string
          client_account_id?: string | null
          company_id?: number | null
          created_at?: string
          direction?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          occurred_at?: string
          product_id?: string | null
          qty_available_after?: number | null
          qty_change?: number
          qty_physical_after?: number | null
          reason?: Database["public"]["Enums"]["inventory_movement_reason"]
          sku?: string
          source?: string
          warehouse_account_id?: string | null
          warehouse_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ai_sellercloud_products"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "sellercloud_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "view_products_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_snapshots: {
        Row: {
          account_id: string
          channel_account_id: string | null
          cost_per_unit: number | null
          id: string
          quantity_available: number | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          sku: string
          snapshot_date: string
          source: string
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          account_id: string
          channel_account_id?: string | null
          cost_per_unit?: number | null
          id?: string
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          sku: string
          snapshot_date?: string
          source: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          account_id?: string
          channel_account_id?: string | null
          cost_per_unit?: number | null
          id?: string
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          sku?: string
          snapshot_date?: string
          source?: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_snapshots_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_snapshots_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_snapshots_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          channel_id: string
          created_at: string | null
          email: string | null
          id: string
          status: string | null
          token: string | null
        }
        Insert: {
          accepted_at?: string | null
          channel_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          status?: string | null
          token?: string | null
        }
        Update: {
          accepted_at?: string | null
          channel_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          status?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["channel_id"]
          },
          {
            foreignKeyName: "invitations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["channel_id"]
          },
        ]
      }
      invite_logs: {
        Row: {
          account_id: string | null
          created_at: string | null
          email: string
          id: string
          invited_by: string | null
          message: string | null
          role: string
          status: string
          type: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          invited_by?: string | null
          message?: string | null
          role: string
          status: string
          type: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          message?: string | null
          role?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "invite_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "invite_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "invite_logs_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_logs_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_logs_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_logs_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_logs_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lead_time_logistics: {
        Row: {
          country_code: string
          country_name: string | null
          created_at: string | null
          domestic_handling_origin_days: number
          domestic_transport_destination_days: number
          export_clearance_days: number
          id: string
          import_clearance_days: number
          international_transit_days: number
          lead_time_adjustment_days: number | null
          notes: string | null
          receiving_days: number
          season: string | null
          total_lead_time: number | null
          transport_mode: string
        }
        Insert: {
          country_code: string
          country_name?: string | null
          created_at?: string | null
          domestic_handling_origin_days: number
          domestic_transport_destination_days: number
          export_clearance_days: number
          id?: string
          import_clearance_days: number
          international_transit_days: number
          lead_time_adjustment_days?: number | null
          notes?: string | null
          receiving_days: number
          season?: string | null
          total_lead_time?: number | null
          transport_mode: string
        }
        Update: {
          country_code?: string
          country_name?: string | null
          created_at?: string | null
          domestic_handling_origin_days?: number
          domestic_transport_destination_days?: number
          export_clearance_days?: number
          id?: string
          import_clearance_days?: number
          international_transit_days?: number
          lead_time_adjustment_days?: number | null
          notes?: string | null
          receiving_days?: number
          season?: string | null
          total_lead_time?: number | null
          transport_mode?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          order_id: string
          quantity: number | null
          sku: string | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id: string
          metadata?: Json | null
          order_id: string
          quantity?: number | null
          sku?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          quantity?: number | null
          sku?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_relation: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_relation_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_relation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          account_id: string | null
          billing_address: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          delivery_date: string | null
          expected_delivery_date: string | null
          expected_shipping_date: string | null
          id: string
          marketplace_name: string | null
          metadata: Json | null
          order_number: string | null
          order_source_order_id: string | null
          origin: string | null
          payment_status: string | null
          provider_id: string | null
          shipping_address: string | null
          shipping_status: string | null
          status: string | null
          total: number | null
        }
        Insert: {
          account_id?: string | null
          billing_address?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          delivery_date?: string | null
          expected_delivery_date?: string | null
          expected_shipping_date?: string | null
          id?: string
          marketplace_name?: string | null
          metadata?: Json | null
          order_number?: string | null
          order_source_order_id?: string | null
          origin?: string | null
          payment_status?: string | null
          provider_id?: string | null
          shipping_address?: string | null
          shipping_status?: string | null
          status?: string | null
          total?: number | null
        }
        Update: {
          account_id?: string | null
          billing_address?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          delivery_date?: string | null
          expected_delivery_date?: string | null
          expected_shipping_date?: string | null
          id?: string
          marketplace_name?: string | null
          metadata?: Json | null
          order_number?: string | null
          order_source_order_id?: string | null
          origin?: string | null
          payment_status?: string | null
          provider_id?: string | null
          shipping_address?: string | null
          shipping_status?: string | null
          status?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_billing_address_fkey"
            columns: ["billing_address"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_fkey"
            columns: ["shipping_address"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          feature: string
          feature_id: string | null
          id: number
          plan_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature: string
          feature_id?: string | null
          id?: number
          plan_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature?: string
          feature_id?: string | null
          id?: number
          plan_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          interval: string
          is_popular: boolean | null
          name: string
          price: number
          status: string
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string | null
          features: Json
          id?: string
          interval?: string
          is_popular?: boolean | null
          name: string
          price: number
          status?: string
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          interval?: string
          is_popular?: boolean | null
          name?: string
          price?: number
          status?: string
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          available: number | null
          created_at: string
          description: string | null
          external_product_id: string | null
          id: string
          on_hold: number | null
          parent_account_id: string
          physical_qty: number | null
          product_name: string | null
          raw: Json
          sellercloud_last_modified_at: string | null
          site_price: number | null
          sku: string
          source: string
          upc: string | null
          updated_at: string
          warehouse_name: string
        }
        Insert: {
          available?: number | null
          created_at?: string
          description?: string | null
          external_product_id?: string | null
          id?: string
          on_hold?: number | null
          parent_account_id: string
          physical_qty?: number | null
          product_name?: string | null
          raw?: Json
          sellercloud_last_modified_at?: string | null
          site_price?: number | null
          sku: string
          source?: string
          upc?: string | null
          updated_at?: string
          warehouse_name?: string
        }
        Update: {
          available?: number | null
          created_at?: string
          description?: string | null
          external_product_id?: string | null
          id?: string
          on_hold?: number | null
          parent_account_id?: string
          physical_qty?: number | null
          product_name?: string | null
          raw?: Json
          sellercloud_last_modified_at?: string | null
          site_price?: number | null
          sku?: string
          source?: string
          upc?: string | null
          updated_at?: string
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "products_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "products_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      saip_boxes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          height_in: number
          id: string
          length_in: number
          max_weight_lbs: number | null
          name: string
          width_in: number
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          height_in: number
          id?: string
          length_in: number
          max_weight_lbs?: number | null
          name: string
          width_in: number
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          height_in?: number
          id?: string
          length_in?: number
          max_weight_lbs?: number | null
          name?: string
          width_in?: number
        }
        Relationships: []
      }
      saip_carrier_services: {
        Row: {
          carrier_code: string
          created_at: string
          display_name: string
          enabled_for_quotes: boolean
          id: string
          is_domestic: boolean
          is_international: boolean
          metadata: Json | null
          service_code: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          carrier_code: string
          created_at?: string
          display_name: string
          enabled_for_quotes?: boolean
          id?: string
          is_domestic?: boolean
          is_international?: boolean
          metadata?: Json | null
          service_code: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          carrier_code?: string
          created_at?: string
          display_name?: string
          enabled_for_quotes?: boolean
          id?: string
          is_domestic?: boolean
          is_international?: boolean
          metadata?: Json | null
          service_code?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      saip_delivery_quote_items: {
        Row: {
          freight_class: string | null
          hazardous: boolean | null
          height: number | null
          id: string
          item_total: number | null
          length: number | null
          metadata: Json | null
          product_name: string | null
          quantity: number | null
          quote_id: string | null
          sku: string | null
          stackable: boolean | null
          unit_price: number | null
          weight: number | null
          width: number | null
        }
        Insert: {
          freight_class?: string | null
          hazardous?: boolean | null
          height?: number | null
          id?: string
          item_total?: number | null
          length?: number | null
          metadata?: Json | null
          product_name?: string | null
          quantity?: number | null
          quote_id?: string | null
          sku?: string | null
          stackable?: boolean | null
          unit_price?: number | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          freight_class?: string | null
          hazardous?: boolean | null
          height?: number | null
          id?: string
          item_total?: number | null
          length?: number | null
          metadata?: Json | null
          product_name?: string | null
          quantity?: number | null
          quote_id?: string | null
          sku?: string | null
          stackable?: boolean | null
          unit_price?: number | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saip_delivery_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "saip_delivery_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      saip_delivery_quotes: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          confirmed: boolean | null
          confirmed_at: string | null
          created_at: string | null
          created_by: string | null
          estimated_freight_cost: number | null
          estimated_product_cost: number | null
          id: string
          markup_amount: number | null
          metadata: Json | null
          quote_number: string | null
          residential_delivery: boolean | null
          sellercloud_order_id: string | null
          ship_date: string | null
          ship_from_address: Json | null
          ship_to_address: Json | null
          shipping_carrier: string | null
          shipping_mode: string | null
          shipping_service: string | null
          total_price: number | null
        }
        Insert: {
          account_id?: string | null
          channel_account_id?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_freight_cost?: number | null
          estimated_product_cost?: number | null
          id?: string
          markup_amount?: number | null
          metadata?: Json | null
          quote_number?: string | null
          residential_delivery?: boolean | null
          sellercloud_order_id?: string | null
          ship_date?: string | null
          ship_from_address?: Json | null
          ship_to_address?: Json | null
          shipping_carrier?: string | null
          shipping_mode?: string | null
          shipping_service?: string | null
          total_price?: number | null
        }
        Update: {
          account_id?: string | null
          channel_account_id?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_freight_cost?: number | null
          estimated_product_cost?: number | null
          id?: string
          markup_amount?: number | null
          metadata?: Json | null
          quote_number?: string | null
          residential_delivery?: boolean | null
          sellercloud_order_id?: string | null
          ship_date?: string | null
          ship_from_address?: Json | null
          ship_to_address?: Json | null
          shipping_carrier?: string | null
          shipping_mode?: string | null
          shipping_service?: string | null
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saip_delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_delivery_quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
        ]
      }
      saip_freight_profit_logs: {
        Row: {
          applied_rule_id: string | null
          base_freight_cost: number | null
          created_at: string | null
          final_freight_price: number | null
          id: string
          markup_applied: number | null
          profit: number | null
          quote_id: string | null
        }
        Insert: {
          applied_rule_id?: string | null
          base_freight_cost?: number | null
          created_at?: string | null
          final_freight_price?: number | null
          id?: string
          markup_applied?: number | null
          profit?: number | null
          quote_id?: string | null
        }
        Update: {
          applied_rule_id?: string | null
          base_freight_cost?: number | null
          created_at?: string | null
          final_freight_price?: number | null
          id?: string
          markup_applied?: number | null
          profit?: number | null
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saip_freight_profit_logs_applied_rule_id_fkey"
            columns: ["applied_rule_id"]
            isOneToOne: false
            referencedRelation: "saip_freight_profit_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_freight_profit_logs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "saip_delivery_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      saip_freight_profit_rules: {
        Row: {
          account_id: string | null
          active: boolean | null
          carrier: string | null
          channel_account_id: string | null
          created_at: string | null
          destination_state: string | null
          id: string
          markup_type: string | null
          markup_value: number | null
          notes: string | null
        }
        Insert: {
          account_id?: string | null
          active?: boolean | null
          carrier?: string | null
          channel_account_id?: string | null
          created_at?: string | null
          destination_state?: string | null
          id?: string
          markup_type?: string | null
          markup_value?: number | null
          notes?: string | null
        }
        Update: {
          account_id?: string | null
          active?: boolean | null
          carrier?: string | null
          channel_account_id?: string | null
          created_at?: string | null
          destination_state?: string | null
          id?: string
          markup_type?: string | null
          markup_value?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saip_freight_profit_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "saip_freight_profit_rules_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      saip_order_drafts: {
        Row: {
          account_id: string | null
          client: Json | null
          created_at: string | null
          id: string
          items: Json | null
          notes: string | null
          optimized_packages: Json | null
          preferences: Json | null
          quote_results: Json | null
          selected_service: Json | null
          sellercloud_order_id: number | null
          sellercloud_status: string | null
          ship_from: Json | null
          ship_to: Json | null
          status: string | null
          step: number | null
          summary: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          client?: Json | null
          created_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          optimized_packages?: Json | null
          preferences?: Json | null
          quote_results?: Json | null
          selected_service?: Json | null
          sellercloud_order_id?: number | null
          sellercloud_status?: string | null
          ship_from?: Json | null
          ship_to?: Json | null
          status?: string | null
          step?: number | null
          summary?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          client?: Json | null
          created_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          optimized_packages?: Json | null
          preferences?: Json | null
          quote_results?: Json | null
          selected_service?: Json | null
          sellercloud_order_id?: number | null
          sellercloud_status?: string | null
          ship_from?: Json | null
          ship_to?: Json | null
          status?: string | null
          step?: number | null
          summary?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saip_order_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_order_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_order_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_order_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_order_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "saip_order_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_order_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      saip_quote_drafts: {
        Row: {
          account_id: string | null
          client: Json | null
          created_at: string | null
          id: string
          items: Json | null
          notes: string | null
          optimized_packages: Json | null
          order: boolean | null
          preferences: Json | null
          quote_results: Json | null
          selected_service: Json | null
          sellercloud_order_id: number | null
          sellercloud_status: string | null
          ship_from: Json | null
          ship_to: Json | null
          status: string | null
          step: number | null
          summary: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          client?: Json | null
          created_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          optimized_packages?: Json | null
          order?: boolean | null
          preferences?: Json | null
          quote_results?: Json | null
          selected_service?: Json | null
          sellercloud_order_id?: number | null
          sellercloud_status?: string | null
          ship_from?: Json | null
          ship_to?: Json | null
          status?: string | null
          step?: number | null
          summary?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          client?: Json | null
          created_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          optimized_packages?: Json | null
          order?: boolean | null
          preferences?: Json | null
          quote_results?: Json | null
          selected_service?: Json | null
          sellercloud_order_id?: number | null
          sellercloud_status?: string | null
          ship_from?: Json | null
          ship_to?: Json | null
          status?: string | null
          step?: number | null
          summary?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saip_quote_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_quote_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_quote_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_quote_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_quote_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "saip_quote_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_quote_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      saip_quote_sellercloud_logs: {
        Row: {
          account_id: string
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          quote_id: string
          response: Json | null
          sellercloud_order_id: number | null
          status: string
        }
        Insert: {
          account_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload: Json
          quote_id: string
          response?: Json | null
          sellercloud_order_id?: number | null
          status?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          quote_id?: string
          response?: Json | null
          sellercloud_order_id?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "saip_quote_sellercloud_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_quote_sellercloud_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_quote_sellercloud_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_quote_sellercloud_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_quote_sellercloud_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "saip_quote_sellercloud_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_quote_sellercloud_logs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "saip_quote_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      saip_shipping_integrations: {
        Row: {
          account_id: string | null
          active: boolean | null
          carrier: string | null
          created_at: string | null
          credentials: Json | null
          id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean | null
          carrier?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
        }
        Update: {
          account_id?: string | null
          active?: boolean | null
          carrier?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saip_shipping_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_shipping_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_shipping_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_shipping_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_shipping_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "saip_shipping_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      saip_shipping_rate_cache: {
        Row: {
          carrier: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string | null
          rate: number | null
          raw_response: Json | null
          service: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string | null
          rate?: number | null
          raw_response?: Json | null
          service?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string | null
          rate?: number | null
          raw_response?: Json | null
          service?: string | null
        }
        Relationships: []
      }
      saip_support_messages: {
        Row: {
          created_at: string | null
          id: string
          internal_note: boolean | null
          message: string
          sender_id: string | null
          ticket_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          internal_note?: boolean | null
          message: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          internal_note?: boolean | null
          message?: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saip_support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saip_support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "saip_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      saip_support_tickets: {
        Row: {
          account_id: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saip_support_tickets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_tickets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_support_tickets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_tickets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_tickets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "saip_support_tickets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "saip_support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saip_support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sellercloud_order_items: {
        Row: {
          id: string
          metadata: Json | null
          order_uuid: string | null
          quantity: number | null
          sku: string | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          order_uuid?: string | null
          quantity?: number | null
          sku?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          order_uuid?: string | null
          quantity?: number | null
          sku?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "ai_orders_unified_6"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud_1"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "get_sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "v_orders_for_billing_recon"
            referencedColumns: ["sc_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_all_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_sellercloud_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sellercloud_orders: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          external_id: number | null
          grand_total: number | null
          id: string
          metadata: Json | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          payment_status: number | null
          sellercloud_created_on: string | null
          sellercloud_customer_id: string | null
          sellercloud_last_updated: string | null
          sellercloud_user_id: number | null
          shipping_status: number | null
          status_code: number | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          external_id?: number | null
          grand_total?: number | null
          id?: string
          metadata?: Json | null
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          payment_status?: number | null
          sellercloud_created_on?: string | null
          sellercloud_customer_id?: string | null
          sellercloud_last_updated?: string | null
          sellercloud_user_id?: number | null
          shipping_status?: number | null
          status_code?: number | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          external_id?: number | null
          grand_total?: number | null
          id?: string
          metadata?: Json | null
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          payment_status?: number | null
          sellercloud_created_on?: string | null
          sellercloud_customer_id?: string | null
          sellercloud_last_updated?: string | null
          sellercloud_user_id?: number | null
          shipping_status?: number | null
          status_code?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      sellercloud_products: {
        Row: {
          account_id: string | null
          asin: string | null
          average_cost: number | null
          brand: string | null
          brand_name: string | null
          buy_it_now_price: number | null
          case_height: number | null
          case_length: number | null
          case_weight: number | null
          case_width: number | null
          channel_id: string | null
          company_id: number | null
          company_name: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          enabled_on_channels: number[] | null
          external_id: string
          gtin: string | null
          height: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_end_of_life: boolean | null
          is_replenishable: boolean | null
          item_url: string | null
          length: number | null
          list_price: number | null
          name: string | null
          package_weight_lbs: number | null
          package_weight_oz: number | null
          price: number | null
          product_type: string | null
          qty_per_case: number | null
          qty_per_pallet: number | null
          quantity_available: number | null
          quantity_physical: number | null
          quantity_sold_15: number | null
          quantity_sold_180: number | null
          quantity_sold_30: number | null
          quantity_sold_365: number | null
          quantity_sold_60: number | null
          quantity_sold_90: number | null
          quantity_sold_ytd: number | null
          shipping_package_type_id: number | null
          shipping_weight: number | null
          site_cost: number | null
          site_price: number | null
          sku: string | null
          upc: string | null
          updated_at: string | null
          warehouse_name: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          account_id?: string | null
          asin?: string | null
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          buy_it_now_price?: number | null
          case_height?: number | null
          case_length?: number | null
          case_weight?: number | null
          case_width?: number | null
          channel_id?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          enabled_on_channels?: number[] | null
          external_id: string
          gtin?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          is_replenishable?: boolean | null
          item_url?: string | null
          length?: number | null
          list_price?: number | null
          name?: string | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
          product_type?: string | null
          qty_per_case?: number | null
          qty_per_pallet?: number | null
          quantity_available?: number | null
          quantity_physical?: number | null
          quantity_sold_15?: number | null
          quantity_sold_180?: number | null
          quantity_sold_30?: number | null
          quantity_sold_365?: number | null
          quantity_sold_60?: number | null
          quantity_sold_90?: number | null
          quantity_sold_ytd?: number | null
          shipping_package_type_id?: number | null
          shipping_weight?: number | null
          site_cost?: number | null
          site_price?: number | null
          sku?: string | null
          upc?: string | null
          updated_at?: string | null
          warehouse_name?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          account_id?: string | null
          asin?: string | null
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          buy_it_now_price?: number | null
          case_height?: number | null
          case_length?: number | null
          case_weight?: number | null
          case_width?: number | null
          channel_id?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          enabled_on_channels?: number[] | null
          external_id?: string
          gtin?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          is_replenishable?: boolean | null
          item_url?: string | null
          length?: number | null
          list_price?: number | null
          name?: string | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
          product_type?: string | null
          qty_per_case?: number | null
          qty_per_pallet?: number | null
          quantity_available?: number | null
          quantity_physical?: number | null
          quantity_sold_15?: number | null
          quantity_sold_180?: number | null
          quantity_sold_30?: number | null
          quantity_sold_365?: number | null
          quantity_sold_60?: number | null
          quantity_sold_90?: number | null
          quantity_sold_ytd?: number | null
          shipping_package_type_id?: number | null
          shipping_weight?: number | null
          site_cost?: number | null
          site_price?: number | null
          sku?: string | null
          upc?: string | null
          updated_at?: string | null
          warehouse_name?: string | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      sellercloud_shipments: {
        Row: {
          account_id: string
          carrier: string | null
          created_at: string | null
          id: string
          raw: Json | null
          sc_order_id: string
          ship_date: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          account_id: string
          carrier?: string | null
          created_at?: string | null
          id?: string
          raw?: Json | null
          sc_order_id: string
          ship_date?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          account_id?: string
          carrier?: string | null
          created_at?: string | null
          id?: string
          raw?: Json | null
          sc_order_id?: string
          ship_date?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_shipments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_shipments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_shipments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_shipments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_shipments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_shipments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      sellercloud_sync_state: {
        Row: {
          account_id: string
          orders_last_synced_at: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          orders_last_synced_at?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          orders_last_synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_sync_state_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      staging_inventory_daily_snapshots: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          parent_client_id: string
          qty: number
          sku: string
          snapshot_date: string
          source: string | null
          total_cft: number
          unit_cft: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          parent_client_id: string
          qty: number
          sku: string
          snapshot_date: string
          source?: string | null
          total_cft: number
          unit_cft: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          parent_client_id?: string
          qty?: number
          sku?: string
          snapshot_date?: string
          source?: string | null
          total_cft?: number
          unit_cft?: number
        }
        Relationships: []
      }
      sync_cursors: {
        Row: {
          account_id: string
          entity: string
          id: number
          last_page: number
          last_synced_at: string | null
        }
        Insert: {
          account_id: string
          entity: string
          id?: number
          last_page?: number
          last_synced_at?: string | null
        }
        Update: {
          account_id?: string
          entity?: string
          id?: number
          last_page?: number
          last_synced_at?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          account_id: string | null
          action: string | null
          created_at: string | null
          details: Json | null
          entity: string | null
          id: string
          status: string | null
        }
        Insert: {
          account_id?: string | null
          action?: string | null
          created_at?: string | null
          details?: Json | null
          entity?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          account_id?: string | null
          action?: string | null
          created_at?: string | null
          details?: Json | null
          entity?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sync_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sync_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      sync_triggers: {
        Row: {
          account_id: string
          attempts: number
          changed_at: string | null
          channel_account_id: string | null
          created_at: string
          entity: string
          entity_id: string
          id: string
          last_error: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          attempts?: number
          changed_at?: string | null
          channel_account_id?: string | null
          created_at?: string
          entity?: string
          entity_id: string
          id?: string
          last_error?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          attempts?: number
          changed_at?: string | null
          channel_account_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          last_error?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_details: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          country: string | null
          gender: string | null
          id: string
          postal_code: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          gender?: string | null
          id: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          gender?: string | null
          id?: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          account_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          email: string
          has_logged_in: boolean | null
          id: string
          is_onboarding_complete: boolean | null
          last_login_at: string | null
          logo_url: string | null
          name: string | null
          phone: string | null
          plan_id: string | null
          role: string
          shared_inventory_client_account_id: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email: string
          has_logged_in?: boolean | null
          id?: string
          is_onboarding_complete?: boolean | null
          last_login_at?: string | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          plan_id?: string | null
          role: string
          shared_inventory_client_account_id?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string
          has_logged_in?: boolean | null
          id?: string
          is_onboarding_complete?: boolean | null
          last_login_at?: string | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          plan_id?: string | null
          role?: string
          shared_inventory_client_account_id?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_shared_inventory_client_account_id_fkey"
            columns: ["shared_inventory_client_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_shared_inventory_client_account_id_fkey"
            columns: ["shared_inventory_client_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "users_shared_inventory_client_account_id_fkey"
            columns: ["shared_inventory_client_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_shared_inventory_client_account_id_fkey"
            columns: ["shared_inventory_client_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_shared_inventory_client_account_id_fkey"
            columns: ["shared_inventory_client_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "users_shared_inventory_client_account_id_fkey"
            columns: ["shared_inventory_client_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      warehouses: {
        Row: {
          account_id: string | null
          address: string | null
          address_2: string | null
          business: string | null
          city: string | null
          code: string | null
          contact_name: string | null
          country: string | null
          created_at: string | null
          creator_first_name: string | null
          creator_last_name: string | null
          creator_middle_name: string | null
          creator_user_name: string | null
          email: string | null
          extensiv_facility_id: string | null
          external_id: number | null
          id: string
          is_default: boolean | null
          meta: Json | null
          metadata: Json | null
          name: string | null
          phone: string | null
          provider_id: string | null
          region: string | null
          sellercloud_warehouse_id: number | null
          state: string | null
          warehouse_type: number | null
          zip_code: string | null
        }
        Insert: {
          account_id?: string | null
          address?: string | null
          address_2?: string | null
          business?: string | null
          city?: string | null
          code?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          creator_first_name?: string | null
          creator_last_name?: string | null
          creator_middle_name?: string | null
          creator_user_name?: string | null
          email?: string | null
          extensiv_facility_id?: string | null
          external_id?: number | null
          id?: string
          is_default?: boolean | null
          meta?: Json | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          provider_id?: string | null
          region?: string | null
          sellercloud_warehouse_id?: number | null
          state?: string | null
          warehouse_type?: number | null
          zip_code?: string | null
        }
        Update: {
          account_id?: string | null
          address?: string | null
          address_2?: string | null
          business?: string | null
          city?: string | null
          code?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          creator_first_name?: string | null
          creator_last_name?: string | null
          creator_middle_name?: string | null
          creator_user_name?: string | null
          email?: string | null
          extensiv_facility_id?: string | null
          external_id?: number | null
          id?: string
          is_default?: boolean | null
          meta?: Json | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          provider_id?: string | null
          region?: string | null
          sellercloud_warehouse_id?: number | null
          state?: string | null
          warehouse_type?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "warehouses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses_relation: {
        Row: {
          created_at: string
          id: string
          user_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_relation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_relation_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "v_warehouses"
            referencedColumns: ["public_warehouse_id"]
          },
          {
            foreignKeyName: "warehouses_relation_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      xai_bot_logs: {
        Row: {
          account_id: string | null
          answer: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          question: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          answer?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          answer?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xai_bot_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_bot_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "xai_bot_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_bot_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_bot_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "xai_bot_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "xai_bot_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_bot_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_bot_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_bot_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_bot_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
        ]
      }
      xai_followup_settings: {
        Row: {
          account_id: string | null
          ask_feedback: boolean | null
          escalate_after_unanswered_count: number | null
          id: string
          send_followup_question: boolean | null
          suggest_related_questions: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          ask_feedback?: boolean | null
          escalate_after_unanswered_count?: number | null
          id?: string
          send_followup_question?: boolean | null
          suggest_related_questions?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          ask_feedback?: boolean | null
          escalate_after_unanswered_count?: number | null
          id?: string
          send_followup_question?: boolean | null
          suggest_related_questions?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xai_followup_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_followup_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "xai_followup_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_followup_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_followup_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "xai_followup_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      xai_log_corrections: {
        Row: {
          approved: boolean | null
          bot_log_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          suggested_reply: string | null
        }
        Insert: {
          approved?: boolean | null
          bot_log_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          suggested_reply?: string | null
        }
        Update: {
          approved?: boolean | null
          bot_log_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          suggested_reply?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xai_log_corrections_bot_log_id_fkey"
            columns: ["bot_log_id"]
            isOneToOne: false
            referencedRelation: "xai_bot_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_log_corrections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_log_corrections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_log_corrections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_log_corrections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_log_corrections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
        ]
      }
      xai_personality_profiles: {
        Row: {
          account_id: string | null
          behavior: string | null
          id: string
          personality_text: string | null
          tone: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          behavior?: string | null
          id?: string
          personality_text?: string | null
          tone?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          behavior?: string | null
          id?: string
          personality_text?: string | null
          tone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xai_personality_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_personality_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "xai_personality_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_personality_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_personality_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "xai_personality_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      xai_training_examples: {
        Row: {
          account_id: string | null
          approved: boolean | null
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          prompt: string
          reply: string
        }
        Insert: {
          account_id?: string | null
          approved?: boolean | null
          category: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt: string
          reply: string
        }
        Update: {
          account_id?: string | null
          approved?: boolean | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt?: string
          reply?: string
        }
        Relationships: [
          {
            foreignKeyName: "xai_training_examples_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_training_examples_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "xai_training_examples_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_training_examples_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_training_examples_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "xai_training_examples_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "xai_training_examples_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "invited_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_training_examples_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "invited_staff_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_training_examples_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_training_examples_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xai_training_examples_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      ai_account_shipping_lead_times: {
        Row: {
          account_country_code: string | null
          account_id: string | null
          account_name: string | null
          channel_country_code: string | null
          channel_id: string | null
          channel_name: string | null
          domestic_handling_origin_days: number | null
          domestic_transport_destination_days: number | null
          export_clearance_days: number | null
          import_clearance_days: number | null
          international_transit_days: number | null
          lead_time_adjustment_days: number | null
          notes: string | null
          receiving_days: number | null
          season: string | null
          total_lead_time: number | null
          transport_mode: string | null
        }
        Relationships: []
      }
      ai_extensiv_shipping_info_items: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          created_at: string | null
          destination_country: string | null
          destination_state: string | null
          estimated_delivery_date: string | null
          item_raw: Json | null
          order_date: string | null
          order_id: string | null
          qty: number | null
          ship_date: string | null
          ship_from_warehouse: string | null
          shipping_carrier: string | null
          shipping_promise_date: string | null
          shipping_service: string | null
          shipping_status: string | null
          sku: string | null
          status_code: number | null
          tracking_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_extensiv_shipping_info_v2: {
        Row: {
          account_id: string | null
          all_tracking_numbers: string | null
          channel_account_id: string | null
          created_at: string | null
          destination_country: string | null
          destination_state: string | null
          estimated_delivery_date: string | null
          marketplace_order_id: string | null
          order_date: string | null
          order_id: string | null
          order_url: string | null
          ship_date: string | null
          ship_from_warehouse: string | null
          shipping_carrier: string | null
          shipping_country: string | null
          shipping_promise_date: string | null
          shipping_service: string | null
          shipping_state: string | null
          shipping_status: string | null
          shipping_weight_oz: string | null
          status_code: number | null
          tracking_number: string | null
        }
        Insert: {
          account_id?: string | null
          all_tracking_numbers?: never
          channel_account_id?: string | null
          created_at?: string | null
          destination_country?: never
          destination_state?: never
          estimated_delivery_date?: never
          marketplace_order_id?: never
          order_date?: string | null
          order_id?: string | null
          order_url?: never
          ship_date?: never
          ship_from_warehouse?: never
          shipping_carrier?: never
          shipping_country?: never
          shipping_promise_date?: never
          shipping_service?: never
          shipping_state?: never
          shipping_status?: never
          shipping_weight_oz?: never
          status_code?: number | null
          tracking_number?: never
        }
        Update: {
          account_id?: string | null
          all_tracking_numbers?: never
          channel_account_id?: string | null
          created_at?: string | null
          destination_country?: never
          destination_state?: never
          estimated_delivery_date?: never
          marketplace_order_id?: never
          order_date?: string | null
          order_id?: string | null
          order_url?: never
          ship_date?: never
          ship_from_warehouse?: never
          shipping_carrier?: never
          shipping_country?: never
          shipping_promise_date?: never
          shipping_service?: never
          shipping_state?: never
          shipping_status?: never
          shipping_weight_oz?: never
          status_code?: number | null
          tracking_number?: never
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_fulfillment_delays_extensiv: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          carrier: string | null
          creation_date: string | null
          delay_interval: string | null
          external_id: string | null
          order_number: string | null
          process_date: string | null
          ship_to_zip: string | null
          tracking_number: string | null
        }
        Insert: {
          account_id?: string | null
          account_id_channel?: string | null
          carrier?: never
          creation_date?: string | null
          delay_interval?: never
          external_id?: string | null
          order_number?: string | null
          process_date?: string | null
          ship_to_zip?: never
          tracking_number?: string | null
        }
        Update: {
          account_id?: string | null
          account_id_channel?: string | null
          carrier?: never
          creation_date?: string | null
          delay_interval?: never
          external_id?: string | null
          order_number?: string | null
          process_date?: string | null
          ship_to_zip?: never
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_fulfillment_timing_extensiv: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          creation_date: string | null
          fulfillment_time: string | null
          fully_allocated: string | null
          order_number: string | null
          pick_done: string | null
          pick_started: string | null
          pick_ticket_printed: string | null
          process_date: string | null
        }
        Insert: {
          account_id?: string | null
          account_id_channel?: string | null
          creation_date?: string | null
          fulfillment_time?: never
          fully_allocated?: never
          order_number?: string | null
          pick_done?: never
          pick_started?: never
          pick_ticket_printed?: never
          process_date?: string | null
        }
        Update: {
          account_id?: string | null
          account_id_channel?: string | null
          creation_date?: string | null
          fulfillment_time?: never
          fully_allocated?: never
          order_number?: string | null
          pick_done?: never
          pick_started?: never
          pick_ticket_printed?: never
          process_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_order_items_unified: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          grand_total: number | null
          order_date: string | null
          order_id: string | null
          order_uuid: string | null
          quantity: number | null
          sku: string | null
          source: string | null
          status_code: number | null
          total_price: number | null
          unit_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "ai_orders_unified_6"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud_1"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "get_sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "v_orders_for_billing_recon"
            referencedColumns: ["sc_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_all_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_order_status_by_client: {
        Row: {
          account_id: string | null
          client_name: string | null
          order_status: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_order_status_by_client_v2: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          order_status: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      ai_orders_by_warehouse: {
        Row: {
          account_id: string | null
          destination_country: string | null
          destination_state: string | null
          order_date: string | null
          order_id: string | null
          shipping_carrier: string | null
          shipping_country: string | null
          shipping_service: string | null
          shipping_state: string | null
          shipping_status: number | null
          status_code: number | null
          tracking_number: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_orders_by_warehouse_v2: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          destination_country: string | null
          destination_state: string | null
          order_date: string | null
          order_id: string | null
          shipping_carrier: string | null
          shipping_country: string | null
          shipping_service: string | null
          shipping_state: string | null
          shipping_status: number | null
          status_code: number | null
          tracking_number: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_orders_per_marketplace_unified: {
        Row: {
          account_id: string | null
          grand_total: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          source: string | null
          status_code: number | null
        }
        Insert: {
          account_id?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          source?: never
          status_code?: number | null
        }
        Update: {
          account_id?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          source?: never
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_orders_summary_by_client: {
        Row: {
          account_id: string | null
          client_name: string | null
          marketplace_name: string | null
          order_status: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_orders_summary_by_marketplace: {
        Row: {
          marketplace_code: string | null
          marketplace_name: string | null
          order_count: number | null
          order_date: string | null
          total_revenue: number | null
        }
        Relationships: []
      }
      ai_orders_unified: {
        Row: {
          account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          payment_status: number | null
          shipping_status: number | null
          source: string | null
          status_code: number | null
        }
        Insert: {
          account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          payment_status?: number | null
          shipping_status?: number | null
          source?: never
          status_code?: number | null
        }
        Update: {
          account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          payment_status?: number | null
          shipping_status?: number | null
          source?: never
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_orders_unified_2: {
        Row: {
          account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_status: string | null
          payment_status: number | null
          shipping_status: number | null
          source: string | null
          status_code: number | null
        }
        Insert: {
          account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_status?: never
          payment_status?: number | null
          shipping_status?: number | null
          source?: never
          status_code?: number | null
        }
        Update: {
          account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_status?: never
          payment_status?: number | null
          shipping_status?: number | null
          source?: never
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_orders_unified_3: {
        Row: {
          account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_status: string | null
          payment_status: string | null
          shipping_status: string | null
          source: string | null
          status_code: number | null
        }
        Relationships: []
      }
      ai_orders_unified_4: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          order_status: string | null
          payment_status: string | null
          shipping_status: string | null
          source: string | null
          status_code: number | null
        }
        Relationships: []
      }
      ai_orders_unified_5: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          order_status: string | null
          payment_status: string | null
          shipping_status: string | null
          source: string | null
          status_code: number | null
        }
        Relationships: []
      }
      ai_orders_unified_6: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          order_status: string | null
          order_uuid: string | null
          payment_status: string | null
          shipping_status: string | null
          source: string | null
          status_code: number | null
        }
        Insert: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          order_status?: never
          order_uuid?: string | null
          payment_status?: never
          shipping_status?: never
          source?: never
          status_code?: number | null
        }
        Update: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          order_status?: never
          order_uuid?: string | null
          payment_status?: never
          shipping_status?: never
          source?: never
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_orders_unified_full: {
        Row: {
          account_id: string | null
          carrier: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at_sellercloud: string | null
          extensiv_account_id_channel: string | null
          extensiv_created_at: string | null
          extensiv_external_id: string | null
          extensiv_order_id: number | null
          extensiv_order_number: string | null
          extensiv_processed_at: string | null
          extensiv_status_code: number | null
          grand_total: number | null
          is_closed: boolean | null
          is_fully_allocated: boolean | null
          last_modified_date: string | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          payment_status: number | null
          pick_done_at: string | null
          pick_started: boolean | null
          pick_ticket_printed_at: string | null
          reference_number: string | null
          sellercloud_status_code: number | null
          ship_to_address: string | null
          ship_to_city: string | null
          ship_to_company: string | null
          ship_to_country: string | null
          ship_to_name: string | null
          ship_to_phone: string | null
          ship_to_state: string | null
          ship_to_zip: string | null
          shipping_mode: string | null
          shipping_status: number | null
          status_closed: boolean | null
          status_fully_allocated: boolean | null
          total_volume: number | null
          total_weight: number | null
          tracking_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["extensiv_account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["extensiv_account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["extensiv_account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["extensiv_account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["extensiv_account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["extensiv_account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_orders_unified_sc_only: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          order_status: string | null
          payment_status: string | null
          shipping_status: string | null
          source: string | null
          status_code: number | null
        }
        Insert: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          order_status?: never
          payment_status?: never
          shipping_status?: never
          source?: never
          status_code?: number | null
        }
        Update: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          order_status?: never
          payment_status?: never
          shipping_status?: never
          source?: never
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_products_unified: {
        Row: {
          account_id: string | null
          average_cost: number | null
          brand: string | null
          brand_name: string | null
          company_id: number | null
          company_name: string | null
          cost: number | null
          created_at: string | null
          image_url: string | null
          is_active: boolean | null
          is_end_of_life: boolean | null
          item_url: string | null
          lead_time_days: number | null
          list_price: number | null
          package_weight_lbs: number | null
          package_weight_oz: number | null
          price: number | null
          product_name: string | null
          product_type: string | null
          quantity_available: number | null
          quantity_physical: number | null
          reorder_point: number | null
          shipping_weight: number | null
          site_cost: number | null
          site_price: number | null
          sku: string | null
          source: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          account_id?: string | null
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          item_url?: string | null
          lead_time_days?: never
          list_price?: number | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity_available?: number | null
          quantity_physical?: number | null
          reorder_point?: never
          shipping_weight?: number | null
          site_cost?: number | null
          site_price?: number | null
          sku?: string | null
          source?: never
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          account_id?: string | null
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          item_url?: string | null
          lead_time_days?: never
          list_price?: number | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity_available?: number | null
          quantity_physical?: number | null
          reorder_point?: never
          shipping_weight?: number | null
          site_cost?: number | null
          site_price?: number | null
          sku?: string | null
          source?: never
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_products_unified_v2: {
        Row: {
          account_id: string | null
          average_cost: number | null
          brand: string | null
          brand_name: string | null
          company_id: number | null
          company_name: string | null
          cost: number | null
          created_at: string | null
          image_url: string | null
          is_active: boolean | null
          is_end_of_life: boolean | null
          item_url: string | null
          lead_time_days: number | null
          list_price: number | null
          package_weight_lbs: number | null
          package_weight_oz: number | null
          price: number | null
          product_name: string | null
          product_type: string | null
          quantity_available: number | null
          quantity_physical: number | null
          reorder_point: number | null
          shipping_weight: number | null
          site_cost: number | null
          site_price: number | null
          sku: string | null
          source: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          account_id?: never
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          item_url?: string | null
          lead_time_days?: never
          list_price?: number | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity_available?: number | null
          quantity_physical?: number | null
          reorder_point?: never
          shipping_weight?: number | null
          site_cost?: number | null
          site_price?: number | null
          sku?: string | null
          source?: never
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          account_id?: never
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          item_url?: string | null
          lead_time_days?: never
          list_price?: number | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity_available?: number | null
          quantity_physical?: number | null
          reorder_point?: never
          shipping_weight?: number | null
          site_cost?: number | null
          site_price?: number | null
          sku?: string | null
          source?: never
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      ai_products_unified_v3: {
        Row: {
          account_id: string | null
          average_cost: number | null
          brand: string | null
          brand_name: string | null
          channel_account_id: string | null
          company_id: string | null
          company_name: string | null
          cost: number | null
          created_at: string | null
          image_url: string | null
          is_active: boolean | null
          is_end_of_life: boolean | null
          item_url: string | null
          lead_time_days: number | null
          list_price: number | null
          package_weight_lbs: number | null
          package_weight_oz: number | null
          price: number | null
          product_name: string | null
          product_type: string | null
          quantity_available: number | null
          quantity_physical: number | null
          reorder_point: number | null
          shipping_weight: number | null
          site_cost: number | null
          site_price: number | null
          sku: string | null
          source: string | null
          updated_at: string | null
          weight: number | null
        }
        Relationships: []
      }
      ai_revenue_trend_by_client: {
        Row: {
          account_id: string | null
          client_name: string | null
          period: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_revenue_trend_by_client_daily: {
        Row: {
          account_id: string | null
          client_name: string | null
          period: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_revenue_trend_by_client_monthly: {
        Row: {
          account_id: string | null
          client_name: string | null
          period: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_routing_info_extensiv: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          carrier: string | null
          order_number: string | null
          origin_zip: string | null
          requires_confirmation: string | null
          requires_return_receipt: string | null
          shipping_mode: string | null
        }
        Insert: {
          account_id?: string | null
          account_id_channel?: string | null
          carrier?: never
          order_number?: string | null
          origin_zip?: never
          requires_confirmation?: never
          requires_return_receipt?: never
          shipping_mode?: never
        }
        Update: {
          account_id?: string | null
          account_id_channel?: string | null
          carrier?: never
          order_number?: string | null
          origin_zip?: never
          requires_confirmation?: never
          requires_return_receipt?: never
          shipping_mode?: never
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sales_by_marketplace_monthly: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          logo: string | null
          marketplace_name: string | null
          month: string | null
          total_orders: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sellercloud_order_items: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          grand_total: number | null
          metadata: Json | null
          order_date: string | null
          order_id: string | null
          order_uuid: string | null
          quantity: number | null
          sku: string | null
          source: string | null
          status_code: number | null
          total_price: number | null
          unit_price: number | null
          uuid: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "ai_orders_unified_6"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud_1"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "get_sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "v_orders_for_billing_recon"
            referencedColumns: ["sc_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_all_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sellercloud_orders: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          metadata: Json | null
          order_date: string | null
          order_id: string | null
          payment_status: number | null
          sellercloud_customer_id: string | null
          sellercloud_user_id: number | null
          shipping_status: number | null
          source: string | null
          status_code: number | null
          uuid: string | null
        }
        Insert: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          metadata?: Json | null
          order_date?: string | null
          order_id?: string | null
          payment_status?: number | null
          sellercloud_customer_id?: string | null
          sellercloud_user_id?: number | null
          shipping_status?: number | null
          source?: never
          status_code?: number | null
          uuid?: string | null
        }
        Update: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          metadata?: Json | null
          order_date?: string | null
          order_id?: string | null
          payment_status?: number | null
          sellercloud_customer_id?: string | null
          sellercloud_user_id?: number | null
          shipping_status?: number | null
          source?: never
          status_code?: number | null
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sellercloud_orders_per_marketplace: {
        Row: {
          account_id: string | null
          grand_total: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          source: string | null
        }
        Insert: {
          account_id?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          source?: never
        }
        Update: {
          account_id?: string | null
          grand_total?: number | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          source?: never
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sellercloud_products: {
        Row: {
          account_id: string | null
          average_cost: number | null
          brand: string | null
          brand_name: string | null
          company_id: number | null
          company_name: string | null
          cost: number | null
          created_at: string | null
          enabled_on_channels: number[] | null
          image_url: string | null
          is_active: boolean | null
          is_end_of_life: boolean | null
          item_url: string | null
          list_price: number | null
          package_weight_lbs: number | null
          package_weight_oz: number | null
          price: number | null
          product_name: string | null
          product_type: string | null
          quantity_available: number | null
          quantity_physical: number | null
          quantity_sold_15: number | null
          quantity_sold_180: number | null
          quantity_sold_30: number | null
          quantity_sold_365: number | null
          quantity_sold_60: number | null
          quantity_sold_90: number | null
          quantity_sold_ytd: number | null
          shipping_weight: number | null
          site_cost: number | null
          site_price: number | null
          sku: string | null
          source: string | null
          updated_at: string | null
          uuid: string | null
          weight: number | null
        }
        Insert: {
          account_id?: string | null
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          enabled_on_channels?: number[] | null
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          item_url?: string | null
          list_price?: number | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity_available?: number | null
          quantity_physical?: number | null
          quantity_sold_15?: number | null
          quantity_sold_180?: number | null
          quantity_sold_30?: number | null
          quantity_sold_365?: number | null
          quantity_sold_60?: number | null
          quantity_sold_90?: number | null
          quantity_sold_ytd?: number | null
          shipping_weight?: number | null
          site_cost?: number | null
          site_price?: number | null
          sku?: string | null
          source?: never
          updated_at?: string | null
          uuid?: string | null
          weight?: number | null
        }
        Update: {
          account_id?: string | null
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          enabled_on_channels?: number[] | null
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          item_url?: string | null
          list_price?: number | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
          product_name?: string | null
          product_type?: string | null
          quantity_available?: number | null
          quantity_physical?: number | null
          quantity_sold_15?: number | null
          quantity_sold_180?: number | null
          quantity_sold_30?: number | null
          quantity_sold_365?: number | null
          quantity_sold_60?: number | null
          quantity_sold_90?: number | null
          quantity_sold_ytd?: number | null
          shipping_weight?: number | null
          site_cost?: number | null
          site_price?: number | null
          sku?: string | null
          source?: never
          updated_at?: string | null
          uuid?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sellercloud_sku_sales_per_day: {
        Row: {
          account_id: string | null
          avg_unit_price: number | null
          quantity_sold: number | null
          sales_date: string | null
          sku: string | null
          source: string | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sellercloud_sku_sales_per_day_v2: {
        Row: {
          account_id: string | null
          avg_unit_price: number | null
          channel_account_id: string | null
          quantity_sold: number | null
          sales_date: string | null
          sku: string | null
          source: string | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sellercloud_stockout_estimate: {
        Row: {
          account_id: string | null
          avg_daily_sales: number | null
          days_to_stockout: number | null
          product_name: string | null
          quantity_available: number | null
          sku: string | null
          source: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_ship_from_warehouses: {
        Row: {
          account_id: string | null
          total_orders: number | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_shipped_items_last_24h: {
        Row: {
          account_id: string | null
          hour: string | null
          total_items: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_shipping_address_extensiv: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          address: string | null
          city: string | null
          country: string | null
          order_number: string | null
          phone: string | null
          ship_to_company: string | null
          ship_to_name: string | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          account_id?: string | null
          account_id_channel?: string | null
          address?: never
          city?: never
          country?: never
          order_number?: string | null
          phone?: never
          ship_to_company?: never
          ship_to_name?: never
          state?: never
          zip_code?: never
        }
        Update: {
          account_id?: string | null
          account_id_channel?: string | null
          address?: never
          city?: never
          country?: never
          order_number?: string | null
          phone?: never
          ship_to_company?: never
          ship_to_name?: never
          state?: never
          zip_code?: never
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_shipping_info: {
        Row: {
          account_id: string | null
          all_tracking_numbers: string | null
          created_at: string | null
          destination_country: string | null
          destination_state: string | null
          estimated_delivery_date: string | null
          marketplace_order_id: string | null
          order_date: string | null
          order_id: string | null
          order_url: string | null
          ship_date: string | null
          ship_from_warehouse: string | null
          shipping_carrier: string | null
          shipping_country: string | null
          shipping_promise_date: string | null
          shipping_service: string | null
          shipping_state: string | null
          shipping_status: number | null
          shipping_weight_oz: string | null
          status_code: number | null
          tracking_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_shipping_info_sc: {
        Row: {
          account_id: string | null
          all_tracking_numbers: string | null
          channel_account_id: string | null
          created_at: string | null
          destination_country: string | null
          destination_state: string | null
          estimated_delivery_date: string | null
          marketplace_order_id: string | null
          order_date: string | null
          order_id: string | null
          order_status: string | null
          order_url: string | null
          ship_date: string | null
          ship_from_warehouse: string | null
          shipping_carrier: string | null
          shipping_country: string | null
          shipping_promise_date: string | null
          shipping_service: string | null
          shipping_state: string | null
          shipping_status: number | null
          shipping_weight_oz: string | null
          status_code: number | null
          tracking_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_shipping_info_sc_v2: {
        Row: {
          account_id: string | null
          all_tracking_numbers: string | null
          channel_account_id: string | null
          created_at: string | null
          destination_country: string | null
          destination_state: string | null
          estimated_delivery_date: string | null
          items_count: number | null
          marketplace_order_id: string | null
          order_date: string | null
          order_id: string | null
          ship_date: string | null
          ship_from_warehouse: string | null
          shipping_carrier: string | null
          shipping_country: string | null
          shipping_promise_date: string | null
          shipping_service: string | null
          shipping_state: string | null
          shipping_status: number | null
          status_code: number | null
          tracking_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_shipping_info_v2: {
        Row: {
          account_id: string | null
          all_tracking_numbers: string | null
          channel_account_id: string | null
          created_at: string | null
          destination_country: string | null
          destination_state: string | null
          estimated_delivery_date: string | null
          marketplace_order_id: string | null
          order_date: string | null
          order_id: string | null
          order_url: string | null
          ship_date: string | null
          ship_from_warehouse: string | null
          shipping_carrier: string | null
          shipping_country: string | null
          shipping_promise_date: string | null
          shipping_service: string | null
          shipping_state: string | null
          shipping_status: number | null
          shipping_weight_oz: string | null
          status_code: number | null
          tracking_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_shipping_info_v3: {
        Row: {
          account_id: string | null
          all_tracking_numbers: string | null
          created_at: string | null
          destination_country: string | null
          destination_state: string | null
          estimated_delivery_date: string | null
          items_count: number | null
          marketplace_order_id: string | null
          order_date: string | null
          order_id: string | null
          order_url: string | null
          ship_date: string | null
          ship_from_warehouse: string | null
          shipping_carrier: string | null
          shipping_country: string | null
          shipping_promise_date: string | null
          shipping_service: string | null
          shipping_state: string | null
          shipping_status: number | null
          shipping_weight_oz: string | null
          status_code: number | null
          tracking_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_shipping_summary_extensiv: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          carrier: string | null
          orders_with_tracking: number | null
          pick_started_ratio: number | null
          ship_date: string | null
          status_1: number | null
          status_2: number | null
          status_3: number | null
          status_4: number | null
          status_5: number | null
          total_orders: number | null
          total_volume: number | null
          total_weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sku_coverage: {
        Row: {
          account_id: string | null
          estimated_coverage_days: number | null
          last_30d_sold: number | null
          product_name: string | null
          quantity_available: number | null
          sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sku_sales_per_day_extensiv: {
        Row: {
          account_id: string | null
          quantity_sold: number | null
          sales_date: string | null
          sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sku_sales_per_day_unified: {
        Row: {
          account_id: string | null
          avg_unit_price: number | null
          marketplace_code: string | null
          marketplace_name: string | null
          quantity_sold: number | null
          sales_date: string | null
          sku: string | null
          source: string | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sku_sales_per_day_unified_v2: {
        Row: {
          account_id: string | null
          avg_unit_price: number | null
          channel_account_id: string | null
          marketplace_code: string | null
          marketplace_name: string | null
          quantity_sold: number | null
          sales_date: string | null
          sku: string | null
          source: string | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_sku_sales_summary: {
        Row: {
          account_id: string | null
          client_name: string | null
          sales_date: string | null
          sku: string | null
          total_revenue: number | null
          total_units: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_stock_coverage_extensiv: {
        Row: {
          account_id: string | null
          at_risk: boolean | null
          avg_daily_sales: number | null
          channel_account_id: string | null
          estimated_coverage_days: number | null
          estimated_stockout_date: string | null
          product_name: string | null
          quantity_available: number | null
          sku: string | null
          urgency_level: string | null
        }
        Relationships: []
      }
      ai_stock_coverage_sellercloud: {
        Row: {
          account_id: string | null
          at_risk: boolean | null
          avg_daily_sales: number | null
          channel_account_id: string | null
          estimated_coverage_days: number | null
          estimated_stockout_date: string | null
          product_name: string | null
          quantity_available: number | null
          sku: string | null
          urgency_level: string | null
        }
        Relationships: []
      }
      ai_stock_coverage_sellercloud_v2: {
        Row: {
          account_id: string | null
          at_risk: boolean | null
          channel_account_id: string | null
          daily_sales_velocity: number | null
          estimated_coverage_days: number | null
          estimated_stockout_date: string | null
          product_name: string | null
          quantity_available: number | null
          sku: string | null
          urgency_level: string | null
        }
        Relationships: []
      }
      ai_stock_coverage_sellercloud_v3: {
        Row: {
          account_id: string | null
          at_risk: boolean | null
          avg_daily_sales: number | null
          channel_account_id: string | null
          daily_sales_velocity: number | null
          estimated_coverage_days: number | null
          estimated_stockout_date: string | null
          last_30d_sold: number | null
          product_name: string | null
          quantity_available: number | null
          sku: string | null
          urgency_level: string | null
        }
        Relationships: []
      }
      ai_stock_coverage_sellercloud_v4: {
        Row: {
          account_id: string | null
          at_risk: boolean | null
          channel_account_id: string | null
          daily_sales_velocity: number | null
          estimated_coverage_days: number | null
          estimated_stockout_date: string | null
          product_name: string | null
          quantity_available: number | null
          sku: string | null
          urgency_level: string | null
        }
        Relationships: []
      }
      ai_stock_coverage_unified: {
        Row: {
          account_id: string | null
          daily_sales_velocity: number | null
          estimated_coverage_days: number | null
          estimated_stockout_date: string | null
          last_30d_sold: number | null
          product_name: string | null
          quantity_available: number | null
          sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_top_selling_products_by_client: {
        Row: {
          account_id: string | null
          client_name: string | null
          sku: string | null
          total_quantity_sold: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_top_selling_products_by_client_v2: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          sku: string | null
          total_quantity_sold: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      ai_tracking_pending_extensiv: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          carrier: string | null
          external_id: string | null
          order_number: string | null
          process_date: string | null
          ship_to_zip: string | null
        }
        Insert: {
          account_id?: string | null
          account_id_channel?: string | null
          carrier?: never
          external_id?: string | null
          order_number?: string | null
          process_date?: string | null
          ship_to_zip?: never
        }
        Update: {
          account_id?: string | null
          account_id_channel?: string | null
          carrier?: never
          external_id?: string | null
          order_number?: string | null
          process_date?: string | null
          ship_to_zip?: never
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      b1_mv_usage_monthly_summary: {
        Row: {
          amount_usd: number | null
          bucket: string | null
          client_account_id: string | null
          month: string | null
          parent_account_id: string | null
          qty: number | null
          warehouse_id: string | null
          warehouse_key_text: string | null
        }
        Relationships: []
      }
      b1_v_barcode_scans_alloc: {
        Row: {
          client_account_id: string | null
          occurred_at: string | null
          parent_account_id: string | null
          total_units: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_barcode_scans_alloc_tiered: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          description: string | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          ref_id: string | null
          tier: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_barcode_tiered_summary_by_client: {
        Row: {
          client_account_id: string | null
          days_count: number | null
          rate_usd: number | null
          tier: string | null
          total_usd: number | null
          units: number | null
        }
        Relationships: []
      }
      b1_v_billing_accounts: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          parent_account_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          parent_account_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          parent_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      b1_v_billing_configs: {
        Row: {
          assigned_warehouse: string | null
          assigned_warehouse_b: string | null
          billing_active: boolean | null
          billing_frequency: string | null
          billing_method: string | null
          client_account_id: string | null
          client_logo_url: string | null
          client_name: string | null
          currency_code: string | null
          cut_off_day: number | null
          default_volume_cuft: number | null
          default_weight_lb: number | null
          dim_divisor: number | null
          discount_pct: number | null
          enabled_services: string[] | null
          free_storage_days: number | null
          id: string | null
          insurance_base_value: number | null
          insurance_pct: number | null
          invoice_cycle: string | null
          monthly_billing_day: number | null
          monthly_minimum_cents: number | null
          outbound_min_order_cents: number | null
          outbound_price_per_label_cents: number | null
          outbound_price_per_lb_cents: number | null
          outbound_price_per_line_cents: number | null
          outbound_price_per_pack_cents: number | null
          outbound_price_per_unit_cents: number | null
          parent_account_id: string | null
          rate_card_id: string | null
          replacement_active: boolean | null
          snapshot_hour_utc: number | null
          storage_price_per_cuft_cents: number | null
          storage_price_per_lb_cents: number | null
          storage_price_per_pallet_day_cents: number | null
          storage_price_per_unit_cents: number | null
          storage_rate_model:
            | "CUFT"
            | "WEIGHT"
            | "UNIT"
            | "PALLET"
            | "LB"
            | "PALLET_DAY"
            | "UNIT_DAY"
            | "CUFT_DAY"
            | null
          tax_exempt: boolean | null
          tax_id: string | null
          template_primary_color: string | null
        }
        Relationships: []
      }
      b1_v_billing_configs_2: {
        Row: {
          assigned_warehouse: string | null
          assigned_warehouse_b: string | null
          billing_active: boolean | null
          billing_frequency: string | null
          billing_method: string | null
          client_account_id: string | null
          client_logo_url: string | null
          client_name: string | null
          created_at: string | null
          currency_code: string | null
          cut_off_day: number | null
          default_volume_cuft: number | null
          default_weight_lb: number | null
          dim_divisor: number | null
          discount_pct: number | null
          enabled_services: string[] | null
          free_storage_days: number | null
          id: string | null
          insurance_base_value: number | null
          insurance_pct: number | null
          invoice_cycle: string | null
          is_default: boolean | null
          monthly_billing_day: number | null
          monthly_minimum_cents: number | null
          outbound_min_order_cents: number | null
          outbound_price_per_label_cents: number | null
          outbound_price_per_lb_cents: number | null
          outbound_price_per_line_cents: number | null
          outbound_price_per_pack_cents: number | null
          outbound_price_per_unit_cents: number | null
          parent_account_id: string | null
          rate_card_id: string | null
          snapshot_hour_utc: number | null
          storage_price_per_cuft_cents: number | null
          storage_price_per_lb_cents: number | null
          storage_price_per_pallet_day_cents: number | null
          storage_price_per_unit_cents: number | null
          storage_rate_model:
            | "CUFT"
            | "WEIGHT"
            | "UNIT"
            | "PALLET"
            | "LB"
            | "PALLET_DAY"
            | "UNIT_DAY"
            | "CUFT_DAY"
            | null
          tax_exempt: boolean | null
          tax_id: string | null
          template_primary_color: string | null
          warehouse_city: string | null
          warehouse_id: string | null
          warehouse_is_default: boolean | null
          warehouse_name: string | null
          warehouse_state: string | null
        }
        Relationships: []
      }
      b1_v_billing_dashboard_all: {
        Row: {
          kpis: Json | null
          parent_account_id: string | null
          unclassified_events: Json | null
          upcoming_invoices: Json | null
          warehouses: Json | null
        }
        Relationships: []
      }
      b1_v_billing_dashboard_summary: {
        Row: {
          mrr_est: number | null
          open_invoices: number | null
          overdue_invoices: number | null
          parent_account_id: string | null
          revenue_last_month: number | null
        }
        Relationships: []
      }
      b1_v_billing_global_services: {
        Row: {
          active: boolean | null
          category: string | null
          default_rate_usd: number | null
          id: string | null
          name: string | null
          unit: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          default_rate_usd?: never
          id?: string | null
          name?: string | null
          unit?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          default_rate_usd?: never
          id?: string | null
          name?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      b1_v_billing_invoices: {
        Row: {
          client_account_id: string | null
          invoice_id: string | null
          parent_account_id: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          total_usd: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_billing_invoices_1_view: {
        Row: {
          client_account_id: string | null
          client_logo_url: string | null
          client_name: string | null
          created_at: string | null
          currency_code: string | null
          id: string | null
          issue_date: string | null
          parent_account_id: string | null
          period: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          subtotal_cents: number | null
          tax_cents: number | null
          total_cents: number | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: []
      }
      b1_v_billing_invoices_upcoming: {
        Row: {
          client_account_id: string | null
          client_name: string | null
          invoice_id: string | null
          parent_account_id: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          total_usd: number | null
        }
        Relationships: []
      }
      b1_v_billing_kpis: {
        Row: {
          mrr_est: number | null
          open_invoices: number | null
          overdue_invoices: number | null
          parent_account_id: string | null
          revenue_last_month: number | null
        }
        Relationships: []
      }
      b1_v_billing_services_by_wh: {
        Row: {
          active: boolean | null
          category: string | null
          default_rate_cents: number | null
          default_rate_usd: number | null
          name: string | null
          service_id: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_billing_unclassified_events: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          event_date: string | null
          id: number | null
          notes: string | null
          occurred_at: string | null
          parent_account_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          amount_usd?: never
          client_account_id?: string | null
          event_date?: string | null
          id?: number | null
          notes?: string | null
          occurred_at?: string | null
          parent_account_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          amount_usd?: never
          client_account_id?: string | null
          event_date?: string | null
          id?: number | null
          notes?: string | null
          occurred_at?: string | null
          parent_account_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: []
      }
      b1_v_billing_upcoming: {
        Row: {
          client_account_id: string | null
          invoice_id: string | null
          parent_account_id: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          total_usd: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_billing_warehouse_summary: {
        Row: {
          city: string | null
          draft_count: number | null
          id: string | null
          open_count: number | null
          overdue_count: number | null
          parent_account_id: string | null
          state: string | null
          upcoming_total_usd: number | null
          warehouse_name: string | null
        }
        Relationships: []
      }
      b1_v_billing_warehouses: {
        Row: {
          draft_count: number | null
          open_count: number | null
          overdue_count: number | null
          parent_account_id: string | null
          upcoming_total_usd: number | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: []
      }
      b1_v_billing_warehouses_c: {
        Row: {
          city: string | null
          draft_count: number | null
          is_active: boolean | null
          open_count: number | null
          overdue_count: number | null
          parent_account_id: string | null
          state: string | null
          upcoming_total_usd: number | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: []
      }
      b1_v_client_service_rates: {
        Row: {
          category: string | null
          client_account_id: string | null
          custom_rate_cents: number | null
          custom_rate_usd: number | null
          default_rate_cents: number | null
          default_rate_usd: number | null
          effective_end: string | null
          effective_rate_cents: number | null
          effective_rate_usd: number | null
          effective_start: string | null
          event: string | null
          has_override: boolean | null
          name: string | null
          override_active: boolean | null
          parent_account_id: string | null
          service_id: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_client_services_effective: {
        Row: {
          category: string | null
          client_account_id: string | null
          effective_rate_cents: number | null
          effective_rate_usd: number | null
          global_rate_cents: number | null
          is_active: boolean | null
          name: string | null
          override_rate_cents: number | null
          parent_account_id: string | null
          service_id: string | null
          unit: string | null
          warehouse_id: string | null
          warehouse_rate_cents: number | null
        }
        Relationships: []
      }
      b1_v_client_warehouses_options: {
        Row: {
          city: string | null
          client_account_id: string | null
          is_default: boolean | null
          label: string | null
          name: string | null
          parent_account_id: string | null
          state: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_clientes: {
        Row: {
          billing_method: string | null
          client_account_id: string | null
          external_ids: string[] | null
          id: string | null
          is_active: boolean | null
          name: string | null
          parent_account_id: string | null
          source: string | null
          warehouse_id: string | null
          warehouse_id_norm: string | null
          wms_customer_id: string | null
        }
        Insert: {
          billing_method?: string | null
          client_account_id?: string | null
          external_ids?: string[] | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          parent_account_id?: string | null
          source?: string | null
          warehouse_id?: string | null
          warehouse_id_norm?: string | null
          wms_customer_id?: string | null
        }
        Update: {
          billing_method?: string | null
          client_account_id?: string | null
          external_ids?: string[] | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          parent_account_id?: string | null
          source?: string | null
          warehouse_id?: string | null
          warehouse_id_norm?: string | null
          wms_customer_id?: string | null
        }
        Relationships: []
      }
      b1_v_invoice_items_1: {
        Row: {
          amount_cents: number | null
          client_account_id: string | null
          description: string | null
          id: string | null
          invoice_id: string | null
          invoice_status: string | null
          metadata: Json | null
          occurred_at: string | null
          parent_account_id: string | null
          period_end: string | null
          period_start: string | null
          qty: number | null
          rate_cents: number | null
          unit: string | null
          usage_id_text: string | null
          usage_kind: string | null
        }
        Relationships: []
      }
      b1_v_invoice_items_public_1: {
        Row: {
          amount_cents: number | null
          description: string | null
          invoice_id: string | null
          qty: number | null
          unit: string | null
          usage_kind: string | null
        }
        Insert: {
          amount_cents?: number | null
          description?: string | null
          invoice_id?: string | null
          qty?: number | null
          unit?: string | null
          usage_kind?: string | null
        }
        Update: {
          amount_cents?: number | null
          description?: string | null
          invoice_id?: string | null
          qty?: number | null
          unit?: string | null
          usage_kind?: string | null
        }
        Relationships: []
      }
      b1_v_invoice_items_public_2: {
        Row: {
          amount_cents: number | null
          description: string | null
          invoice_id: string | null
          metadata: Json | null
          qty: number | null
          unit: string | null
          usage_kind: string | null
        }
        Insert: {
          amount_cents?: number | null
          description?: string | null
          invoice_id?: string | null
          metadata?: Json | null
          qty?: number | null
          unit?: string | null
          usage_kind?: string | null
        }
        Update: {
          amount_cents?: number | null
          description?: string | null
          invoice_id?: string | null
          metadata?: Json | null
          qty?: number | null
          unit?: string | null
          usage_kind?: string | null
        }
        Relationships: []
      }
      b1_v_invoice_public_1: {
        Row: {
          client_name: string | null
          currency_code: string | null
          id: string | null
          issued_at: string | null
          period_end: string | null
          period_start: string | null
          total_cents: number | null
        }
        Relationships: []
      }
      b1_v_invoice_usage_unified: {
        Row: {
          amount_usd: number | null
          category: string | null
          client_account_id: string | null
          description: string | null
          marketplace_id: string | null
          order_id: string | null
          parent_account_id: string | null
          qty: number | null
          rate_usd: number | null
          snapshot_date: string | null
          source: string | null
          source_type: string | null
          status: string | null
          type_label: string | null
          unit: string | null
          usage_id: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_invoice_usage_unified_2: {
        Row: {
          amount_usd: number | null
          category: string | null
          client_account_id: string | null
          description: string | null
          order_id: string | null
          parent_account_id: string | null
          qty: number | null
          rate_usd: number | null
          sellercloud_cs_key: string | null
          snapshot_date: string | null
          source: string | null
          source_type: string | null
          status: string | null
          type_label: string | null
          unit: string | null
          usage_id: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_orders_extensiv_only: {
        Row: {
          account_id: string | null
          customer_external_id: string | null
          customer_name: string | null
          extensiv_creation_date: string | null
          extensiv_cs_key: string | null
          extensiv_external_id: string | null
          extensiv_last_modified_date: string | null
          extensiv_notes: string | null
          extensiv_num_key: string | null
          extensiv_order_number: string | null
          extensiv_order_pk: number | null
          extensiv_status: number | null
          extensiv_total_items: number | null
          extensiv_total_volume: number | null
          extensiv_total_weight: number | null
          facility_external_id: string | null
          facility_name: string | null
          is_billable_order: boolean | null
          is_replacement_or_canceled: boolean | null
          join_key: string | null
          match_type: string | null
          order_exception_type: string | null
          process_date: string | null
          status_closed: boolean | null
          status_fully_allocated: boolean | null
          total_items: number | null
          tracking_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      b1_v_orders_extensiv_sellercloud: {
        Row: {
          account_id: string | null
          customer_external_id: string | null
          customer_name: string | null
          extensiv_creation_date: string | null
          extensiv_cs_key: string | null
          extensiv_external_id: string | null
          extensiv_last_modified_date: string | null
          extensiv_notes: string | null
          extensiv_num_key: string | null
          extensiv_order_number: string | null
          extensiv_order_pk: number | null
          extensiv_status: number | null
          extensiv_total_items: number | null
          extensiv_total_volume: number | null
          extensiv_total_weight: number | null
          facility_external_id: string | null
          facility_name: string | null
          grand_total: number | null
          has_wrapping_items: boolean | null
          is_billable_order: boolean | null
          is_replacement_or_canceled: boolean | null
          join_key: string | null
          match_type: string | null
          order_exception_type: string | null
          order_id: string | null
          order_source_order_id: string | null
          payment_status: number | null
          process_date: string | null
          sellercloud_client_name: string | null
          sellercloud_cs_key: string | null
          sellercloud_customer_id: string | null
          sellercloud_non_wrapping_items: number | null
          sellercloud_num_key: string | null
          sellercloud_order_date: string | null
          sellercloud_order_pk: string | null
          sellercloud_status_code: number | null
          sellercloud_total_items: number | null
          sellercloud_user_id: number | null
          sellercloud_wrapping_items: number | null
          shipping_status: number | null
          status_closed: boolean | null
          status_fully_allocated: boolean | null
          total_items: number | null
          tracking_number: string | null
        }
        Relationships: []
      }
      b1_v_orders_extensiv_sellercloud_1: {
        Row: {
          account_id: string | null
          customer_external_id: string | null
          customer_name: string | null
          extensiv_creation_date: string | null
          extensiv_cs_key: string | null
          extensiv_external_id: string | null
          extensiv_last_modified_date: string | null
          extensiv_notes: string | null
          extensiv_num_key: string | null
          extensiv_order_number: string | null
          extensiv_order_pk: number | null
          extensiv_status: number | null
          extensiv_total_items: number | null
          extensiv_total_volume: number | null
          extensiv_total_weight: number | null
          facility_external_id: string | null
          facility_name: string | null
          grand_total: number | null
          has_wrapping_items: boolean | null
          is_billable_order: boolean | null
          is_replacement_or_canceled: boolean | null
          join_key: string | null
          match_type: string | null
          order_exception_type: string | null
          order_id: string | null
          order_source_order_id: string | null
          payment_status: number | null
          process_date: string | null
          sellercloud_client_name: string | null
          sellercloud_cs_key: string | null
          sellercloud_customer_id: string | null
          sellercloud_non_wrapping_items: number | null
          sellercloud_num_key: string | null
          sellercloud_order_date: string | null
          sellercloud_order_pk: string | null
          sellercloud_status_code: number | null
          sellercloud_total_items: number | null
          sellercloud_user_id: number | null
          sellercloud_wrapping_items: number | null
          shipping_status: number | null
          status_closed: boolean | null
          status_fully_allocated: boolean | null
          total_items: number | null
          tracking_number: string | null
        }
        Relationships: []
      }
      b1_v_outbound_billing_clients: {
        Row: {
          cf_tier: string | null
          client_account_id: string | null
          client_name: string | null
          orders: number | null
          rate_usd: number | null
          total_usd: number | null
          units: number | null
        }
        Relationships: []
      }
      b1_v_outbound_cf_enriched: {
        Row: {
          cf_per_unit: number | null
          cf_tier: string | null
          client_account_id: string | null
          id: string | null
          order_date: string | null
          order_id: string | null
          package_count: number | null
          parent_account_id: string | null
          shipping_weight_lb: number | null
          track_ct: number | null
          unit_count: number | null
          unit_guess: number | null
          unit_reason: string | null
          vol_reason: string | null
          volume_cuft: number | null
          volume_guess: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_outbound_invoice_usage_1: {
        Row: {
          amount_usd: number | null
          category: string | null
          client_account_id: string | null
          description: string | null
          marketplace_id: string | null
          order_id: string | null
          parent_account_id: string | null
          qty: number | null
          rate_usd: number | null
          snapshot_date: string | null
          source: string | null
          source_type: string | null
          status: string | null
          type_label: string | null
          unit: string | null
          usage_id: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_services_catalog: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          default_rate_cents: number | null
          default_rate_usd: number | null
          event: string | null
          name: string | null
          service_id: string | null
          unit: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          default_rate_cents?: number | null
          default_rate_usd?: never
          event?: never
          name?: string | null
          service_id?: string | null
          unit?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          default_rate_cents?: number | null
          default_rate_usd?: never
          event?: never
          name?: string | null
          service_id?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      b1_v_storage_billing_daily: {
        Row: {
          amount_usd: number | null
          base_rate_usd_per_cuft_day: number | null
          client_account_id: string | null
          parent_account_id: string | null
          snapshot_date: string | null
          surcharge_usd_per_cuft_day: number | null
          total_rate_usd_per_cuft_day: number | null
          total_volume_cuft: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_storage_billing_daily_w_spare: {
        Row: {
          amount_usd: number | null
          base_rate_usd_per_cuft_day: number | null
          client_account_id: string | null
          parent_account_id: string | null
          snapshot_date: string | null
          surcharge_usd_per_cuft_day: number | null
          total_rate_usd_per_cuft_day: number | null
          total_volume_cuft: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_storage_billing_daily_wo_spare: {
        Row: {
          client_account_id: string | null
          parent_account_id: string | null
          snapshot_date: string | null
          total_volume_cuft: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_storage_billing_monthly: {
        Row: {
          amount_usd_month: number | null
          avg_rate_usd_per_cuft_day: number | null
          client_account_id: string | null
          month: string | null
          parent_account_id: string | null
          total_volume_cuft_month: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_storage_snapshot_latest: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          parent_account_id: string | null
          rate_usd_per_cuft: number | null
          snapshot_date: string | null
          total_volume_cuft: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_storage_volume_client_daily: {
        Row: {
          client_account_id: string | null
          distinct_skus: number | null
          parent_account_id: string | null
          snapshot_date: string | null
          total_allocated_units: number | null
          total_available_units: number | null
          total_on_hold_units: number | null
          total_units: number | null
          total_volume_cuft: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_usage_accessorials: {
        Row: {
          amount_usd: number | null
          category: string | null
          client_account_id: string | null
          notes: string | null
          parent_account_id: string | null
          qty: number | null
          rate_usd: number | null
          reference_ids: Json | null
          service_name: string | null
          unit: string | null
          usage_date: string | null
          usage_type: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_usage_barcode_from_storage: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          description: string | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          ref_id: string | null
          service_id: string | null
          warehouse_ref: string | null
        }
        Relationships: []
      }
      b1_v_usage_barcode_tiered: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          description: string | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          ref_id: string | null
          tier: string | null
          warehouse_ref: string | null
        }
        Relationships: []
      }
      b1_v_usage_monthly_summary: {
        Row: {
          amount_usd: number | null
          bucket: string | null
          client_account_id: string | null
          month: string | null
          parent_account_id: string | null
          qty: number | null
          warehouse_id: string | null
          warehouse_key_text: string | null
        }
        Relationships: []
      }
      b1_v_usage_outbound: {
        Row: {
          amount: number | null
          client_account_id: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: number | null
          rate: number | null
          service_code: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_ref: string | null
        }
        Insert: {
          amount?: never
          client_account_id?: string | null
          description?: never
          id?: string | null
          metadata?: never
          occurred_at?: never
          parent_account_id?: string | null
          quantity?: never
          rate?: never
          service_code?: never
          source?: string | null
          status?: never
          unit?: never
          warehouse_ref?: never
        }
        Update: {
          amount?: never
          client_account_id?: string | null
          description?: never
          id?: string | null
          metadata?: never
          occurred_at?: never
          parent_account_id?: string | null
          quantity?: never
          rate?: never
          service_code?: never
          source?: string | null
          status?: never
          unit?: never
          warehouse_ref?: never
        }
        Relationships: []
      }
      b1_v_usage_storage_daily: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          parent_account_id: string | null
          qty_units: number | null
          sku: string | null
          storage_price_per_cuft_cents: number | null
          unit_volume_cuft: number | null
          usage_date: string | null
          usage_type: string | null
          volume_cuft: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_usage_supplies: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          description: string | null
          id_text: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          ref_id: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_usage_unified: {
        Row: {
          amount_cents: number | null
          amount_usd: number | null
          client_account_id: string | null
          description: string | null
          id: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_cents: number | null
          rate_usd: number | null
          ref_id: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_usage_unified_2: {
        Row: {
          amount_cents: number | null
          amount_usd: number | null
          client_account_id: string | null
          description: string | null
          id: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: string | null
          rate_cents: number | null
          rate_usd: number | null
          ref_id: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_usage_unified_25: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          id_text: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          ref_id: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_usage_unified_3: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          description: string | null
          id: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          ref_id: string | null
          service_text: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Insert: {
          amount_usd?: never
          client_account_id?: string | null
          description?: never
          id?: string | null
          kind?: never
          metadata?: never
          occurred_at?: never
          parent_account_id?: string | null
          quantity?: never
          rate_usd?: never
          ref_id?: string | null
          service_text?: never
          source?: never
          status?: never
          unit?: never
          warehouse_id?: never
        }
        Update: {
          amount_usd?: never
          client_account_id?: string | null
          description?: never
          id?: string | null
          kind?: never
          metadata?: never
          occurred_at?: never
          parent_account_id?: string | null
          quantity?: never
          rate_usd?: never
          ref_id?: string | null
          service_text?: never
          source?: never
          status?: never
          unit?: never
          warehouse_id?: never
        }
        Relationships: []
      }
      b1_v_usage_unified_4: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          description: string | null
          id: string | null
          kind: string | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: string | null
          rate_usd: number | null
          ref_id: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_usage_unified_final: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          description: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          ref_id: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b1_v_warehouse_services_1: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          event: "ONCE" | "PER_UNIT" | "OTHER" | "PERCENTAGE" | null
          global_service_id: string | null
          metadata: Json | null
          name: string | null
          rate_cents: number | null
          rate_usd: number | null
          unit: string | null
          updated_at: string | null
          warehouse_id: string | null
          warehouse_service_id: string | null
        }
        Relationships: []
      }
      b2_v_usage_accessorials: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          id_text: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          order_id: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          service_code: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b2_v_usage_outbound: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          id_text: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          order_id: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          service_code: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Insert: {
          amount_usd?: never
          client_account_id?: string | null
          id_text?: never
          kind?: never
          metadata?: Json | null
          occurred_at?: string | null
          order_id?: never
          parent_account_id?: string | null
          quantity?: never
          rate_usd?: never
          service_code?: never
          source?: never
          status?: never
          unit?: never
          warehouse_id?: string | null
        }
        Update: {
          amount_usd?: never
          client_account_id?: string | null
          id_text?: never
          kind?: never
          metadata?: Json | null
          occurred_at?: string | null
          order_id?: never
          parent_account_id?: string | null
          quantity?: never
          rate_usd?: never
          service_code?: never
          source?: never
          status?: never
          unit?: never
          warehouse_id?: string | null
        }
        Relationships: []
      }
      b2_v_usage_storage: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          id_text: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          order_id: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          service_code: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      b2_v_usage_unified: {
        Row: {
          amount_usd: number | null
          client_account_id: string | null
          id_text: string | null
          kind: string | null
          metadata: Json | null
          occurred_at: string | null
          order_id: string | null
          parent_account_id: string | null
          quantity: number | null
          rate_usd: number | null
          service_code: string | null
          source: string | null
          status: string | null
          unit: string | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      billing_client_service_overrides: {
        Row: {
          active: boolean | null
          client_account_id: string | null
          notes: string | null
          override_rate_cents: number | null
          parent_account_id: string | null
          service_id: string | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          active?: boolean | null
          client_account_id?: string | null
          notes?: string | null
          override_rate_cents?: number | null
          parent_account_id?: string | null
          service_id?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          active?: boolean | null
          client_account_id?: string | null
          notes?: string | null
          override_rate_cents?: number | null
          parent_account_id?: string | null
          service_id?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: []
      }
      billing_clients: {
        Row: {
          billing_method: string | null
          client_account_id: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          parent_account_id: string | null
          source: string | null
          warehouse_id: string | null
          warehouse_id_norm: string | null
          wms_customer_id: string | null
        }
        Insert: {
          billing_method?: string | null
          client_account_id?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          parent_account_id?: string | null
          source?: string | null
          warehouse_id?: string | null
          warehouse_id_norm?: string | null
          wms_customer_id?: string | null
        }
        Update: {
          billing_method?: string | null
          client_account_id?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          parent_account_id?: string | null
          source?: string | null
          warehouse_id?: string | null
          warehouse_id_norm?: string | null
          wms_customer_id?: string | null
        }
        Relationships: []
      }
      billing_clients_view: {
        Row: {
          client_account_id: string | null
          client_name: string | null
          is_active: boolean | null
          parent_account_id: string | null
          warehouse_id: string | null
          wms_customer_id: string | null
        }
        Relationships: []
      }
      billing_configs: {
        Row: {
          billing_active: boolean | null
          billing_method: string | null
          client_account_id: string | null
          created_at: string | null
          currency_code: string | null
          cut_off_day: number | null
          default_volume_cuft: number | null
          default_weight_lb: number | null
          dim_divisor: number | null
          discount_pct: number | null
          enabled_services: string[] | null
          free_storage_days: number | null
          id: string | null
          insurance_base_value: number | null
          insurance_pct: number | null
          invoice_cycle: string | null
          is_active: boolean | null
          min_monthly_fee_cents: number | null
          monthly_minimum_cents: number | null
          outbound_min_order_cents: number | null
          outbound_price_per_label_cents: number | null
          outbound_price_per_lb_cents: number | null
          outbound_price_per_line_cents: number | null
          outbound_price_per_pack_cents: number | null
          outbound_price_per_unit_cents: number | null
          parent_account_id: string | null
          rate_card_id: string | null
          rate_storage_usd_per_cuft: number | null
          secondary_warehouse_id: string | null
          snapshot_hour_utc: number | null
          storage_price_per_cuft_cents: number | null
          storage_price_per_lb_cents: number | null
          storage_price_per_pallet_day_cents: number | null
          storage_price_per_unit_cents: number | null
          storage_rate_model:
            | "CUFT"
            | "WEIGHT"
            | "UNIT"
            | "PALLET"
            | "LB"
            | "PALLET_DAY"
            | "UNIT_DAY"
            | "CUFT_DAY"
            | null
          tax_exempt: boolean | null
          tax_id: string | null
          template_primary_color: string | null
          warehouse_id: string | null
        }
        Insert: {
          billing_active?: boolean | null
          billing_method?: string | null
          client_account_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          cut_off_day?: number | null
          default_volume_cuft?: number | null
          default_weight_lb?: number | null
          dim_divisor?: number | null
          discount_pct?: number | null
          enabled_services?: string[] | null
          free_storage_days?: number | null
          id?: string | null
          insurance_base_value?: number | null
          insurance_pct?: number | null
          invoice_cycle?: string | null
          is_active?: boolean | null
          min_monthly_fee_cents?: number | null
          monthly_minimum_cents?: number | null
          outbound_min_order_cents?: number | null
          outbound_price_per_label_cents?: number | null
          outbound_price_per_lb_cents?: number | null
          outbound_price_per_line_cents?: number | null
          outbound_price_per_pack_cents?: number | null
          outbound_price_per_unit_cents?: number | null
          parent_account_id?: string | null
          rate_card_id?: string | null
          rate_storage_usd_per_cuft?: number | null
          secondary_warehouse_id?: string | null
          snapshot_hour_utc?: number | null
          storage_price_per_cuft_cents?: number | null
          storage_price_per_lb_cents?: number | null
          storage_price_per_pallet_day_cents?: number | null
          storage_price_per_unit_cents?: number | null
          storage_rate_model?:
            | "CUFT"
            | "WEIGHT"
            | "UNIT"
            | "PALLET"
            | "LB"
            | "PALLET_DAY"
            | "UNIT_DAY"
            | "CUFT_DAY"
            | null
          tax_exempt?: boolean | null
          tax_id?: string | null
          template_primary_color?: string | null
          warehouse_id?: string | null
        }
        Update: {
          billing_active?: boolean | null
          billing_method?: string | null
          client_account_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          cut_off_day?: number | null
          default_volume_cuft?: number | null
          default_weight_lb?: number | null
          dim_divisor?: number | null
          discount_pct?: number | null
          enabled_services?: string[] | null
          free_storage_days?: number | null
          id?: string | null
          insurance_base_value?: number | null
          insurance_pct?: number | null
          invoice_cycle?: string | null
          is_active?: boolean | null
          min_monthly_fee_cents?: number | null
          monthly_minimum_cents?: number | null
          outbound_min_order_cents?: number | null
          outbound_price_per_label_cents?: number | null
          outbound_price_per_lb_cents?: number | null
          outbound_price_per_line_cents?: number | null
          outbound_price_per_pack_cents?: number | null
          outbound_price_per_unit_cents?: number | null
          parent_account_id?: string | null
          rate_card_id?: string | null
          rate_storage_usd_per_cuft?: number | null
          secondary_warehouse_id?: string | null
          snapshot_hour_utc?: number | null
          storage_price_per_cuft_cents?: number | null
          storage_price_per_lb_cents?: number | null
          storage_price_per_pallet_day_cents?: number | null
          storage_price_per_unit_cents?: number | null
          storage_rate_model?:
            | "CUFT"
            | "WEIGHT"
            | "UNIT"
            | "PALLET"
            | "LB"
            | "PALLET_DAY"
            | "UNIT_DAY"
            | "CUFT_DAY"
            | null
          tax_exempt?: boolean | null
          tax_id?: string | null
          template_primary_color?: string | null
          warehouse_id?: string | null
        }
        Relationships: []
      }
      billing_invoices_1_view: {
        Row: {
          client_account_id: string | null
          id: string | null
          issue_date: string | null
          parent_account_id: string | null
          period: string | null
          status: string | null
          total_cents: number | null
        }
        Insert: {
          client_account_id?: string | null
          id?: string | null
          issue_date?: string | null
          parent_account_id?: string | null
          period?: never
          status?: string | null
          total_cents?: number | null
        }
        Update: {
          client_account_id?: string | null
          id?: string | null
          issue_date?: string | null
          parent_account_id?: string | null
          period?: never
          status?: string | null
          total_cents?: number | null
        }
        Relationships: []
      }
      billing_products_effective_view: {
        Row: {
          client_account_id: string | null
          sku: string | null
          volume_cuft_effective: number | null
          weight_lb_effective: number | null
        }
        Relationships: []
      }
      billing_products_sync_cursors_view: {
        Row: {
          client_account_id: string | null
          last_modified_seen: string | null
          last_run_at: string | null
          parent_account_id: string | null
        }
        Insert: {
          client_account_id?: string | null
          last_modified_seen?: string | null
          last_run_at?: string | null
          parent_account_id?: string | null
        }
        Update: {
          client_account_id?: string | null
          last_modified_seen?: string | null
          last_run_at?: string | null
          parent_account_id?: string | null
        }
        Relationships: []
      }
      confirmed_users_view: {
        Row: {
          email: string | null
          email_confirmed_at: string | null
          id: string | null
        }
        Insert: {
          email?: string | null
          email_confirmed_at?: string | null
          id?: string | null
        }
        Update: {
          email?: string | null
          email_confirmed_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
      extensiv_orders_logistics_summary: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          bill_to_address: string | null
          bill_to_city: string | null
          bill_to_name: string | null
          bill_to_state: string | null
          bill_to_zip: string | null
          carrier: string | null
          channel_id: string | null
          creation_date: string | null
          customer_name: string | null
          external_id: string | null
          id: number | null
          is_closed: boolean | null
          is_cod: boolean | null
          is_fully_allocated: boolean | null
          is_insured: boolean | null
          last_modified_date: string | null
          order_description: string | null
          order_number: string | null
          pick_done_at: string | null
          pick_started: boolean | null
          pick_ticket_printed_at: string | null
          po_number: string | null
          process_date: string | null
          reference_number: string | null
          ship_to_address: string | null
          ship_to_city: string | null
          ship_to_company: string | null
          ship_to_country: string | null
          ship_to_name: string | null
          ship_to_phone: string | null
          ship_to_state: string | null
          ship_to_zip: string | null
          shipping_mode: string | null
          status: number | null
          status_closed: boolean | null
          status_code: number | null
          status_fully_allocated: boolean | null
          total_volume: number | null
          total_weight: number | null
          tracking_number: string | null
        }
        Insert: {
          account_id?: string | null
          account_id_channel?: string | null
          bill_to_address?: never
          bill_to_city?: never
          bill_to_name?: never
          bill_to_state?: never
          bill_to_zip?: never
          carrier?: never
          channel_id?: string | null
          creation_date?: string | null
          customer_name?: string | null
          external_id?: string | null
          id?: number | null
          is_closed?: never
          is_cod?: never
          is_fully_allocated?: never
          is_insured?: never
          last_modified_date?: string | null
          order_description?: never
          order_number?: string | null
          pick_done_at?: never
          pick_started?: never
          pick_ticket_printed_at?: never
          po_number?: never
          process_date?: string | null
          reference_number?: never
          ship_to_address?: never
          ship_to_city?: never
          ship_to_company?: never
          ship_to_country?: never
          ship_to_name?: never
          ship_to_phone?: never
          ship_to_state?: never
          ship_to_zip?: never
          shipping_mode?: never
          status?: number | null
          status_closed?: boolean | null
          status_code?: never
          status_fully_allocated?: boolean | null
          total_volume?: number | null
          total_weight?: number | null
          tracking_number?: string | null
        }
        Update: {
          account_id?: string | null
          account_id_channel?: string | null
          bill_to_address?: never
          bill_to_city?: never
          bill_to_name?: never
          bill_to_state?: never
          bill_to_zip?: never
          carrier?: never
          channel_id?: string | null
          creation_date?: string | null
          customer_name?: string | null
          external_id?: string | null
          id?: number | null
          is_closed?: never
          is_cod?: never
          is_fully_allocated?: never
          is_insured?: never
          last_modified_date?: string | null
          order_description?: never
          order_number?: string | null
          pick_done_at?: never
          pick_started?: never
          pick_ticket_printed_at?: never
          po_number?: never
          process_date?: string | null
          reference_number?: never
          ship_to_address?: never
          ship_to_city?: never
          ship_to_company?: never
          ship_to_country?: never
          ship_to_name?: never
          ship_to_phone?: never
          ship_to_state?: never
          ship_to_zip?: never
          shipping_mode?: never
          status?: number | null
          status_closed?: boolean | null
          status_code?: never
          status_fully_allocated?: boolean | null
          total_volume?: number | null
          total_weight?: number | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["channel_id"]
          },
          {
            foreignKeyName: "extensiv_orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["channel_id"]
          },
        ]
      }
      extensiv_products_normalized: {
        Row: {
          account_id: string | null
          average_cost: number | null
          brand: string | null
          brand_name: string | null
          channel_account_id: string | null
          company_id: string | null
          company_name: string | null
          cost: number | null
          created_at: string | null
          external_id: string | null
          height: number | null
          id: string | null
          image_url: string | null
          inventory_updated_at: string | null
          is_active: boolean | null
          is_end_of_life: boolean | null
          item_url: string | null
          length: number | null
          list_price: number | null
          name: string | null
          price: number | null
          product_type: string | null
          quantity_available: number | null
          quantity_physical: number | null
          site_cost: number | null
          site_price: number | null
          sku: string | null
          source: string | null
          upc: string | null
          updated_at: string | null
          weight: number | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_products_channel_account_id_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      get_accounts: {
        Row: {
          id: string | null
          is_main_account: boolean | null
          name: string | null
          parent_account_id: string | null
          status: string | null
        }
        Insert: {
          id?: string | null
          is_main_account?: never
          name?: string | null
          parent_account_id?: string | null
          status?: string | null
        }
        Update: {
          id?: string | null
          is_main_account?: never
          name?: string | null
          parent_account_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      get_sellercloud_orders: {
        Row: {
          account_id: string | null
          client_name: string | null
          id: string | null
          marketplace: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          order_url: string | null
          ship_date: string | null
          shipping_carrier: string | null
          shipping_service: string | null
          status: string | null
          status_code: number | null
          total_amount: number | null
        }
        Insert: {
          account_id?: string | null
          client_name?: string | null
          id?: string | null
          marketplace?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          order_url?: never
          ship_date?: never
          shipping_carrier?: never
          shipping_service?: never
          status?: never
          status_code?: number | null
          total_amount?: number | null
        }
        Update: {
          account_id?: string | null
          client_name?: string | null
          id?: string | null
          marketplace?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          order_url?: never
          ship_date?: never
          shipping_carrier?: never
          shipping_service?: never
          status?: never
          status_code?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      integration_company_account_map_v: {
        Row: {
          client_account_id: string | null
          company_ref: string | null
          integration: string | null
          warehouse_account_id: string | null
        }
        Relationships: []
      }
      inventory_balance_by_sku_wh: {
        Row: {
          account_id: string | null
          first_movement_at: string | null
          last_movement_at: string | null
          latest_qty_available_after: number | null
          latest_qty_physical_after: number | null
          latest_snapshot_at: string | null
          sku: string | null
          total_delta: number | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      inventory_latest_snapshot: {
        Row: {
          account_id: string | null
          last_occurred_at: string | null
          qty_available_after: number | null
          qty_physical_after: number | null
          sku: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      inventory_summary: {
        Row: {
          account_id: string | null
          brand: string | null
          company_id: number | null
          company_name: string | null
          cost: number | null
          inflow_30d: number | null
          inflow_7d: number | null
          is_active: boolean | null
          latest_snapshot_at: string | null
          name: string | null
          outflow_30d: number | null
          outflow_7d: number | null
          product_id: string | null
          qty_available_now: number | null
          qty_physical_now: number | null
          site_price: number | null
          sku: string | null
          store_price: number | null
          total_delta: number | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      invited_staff_view: {
        Row: {
          account_id: string | null
          created_at: string | null
          email: string | null
          has_logged_in: boolean | null
          id: string | null
          invite_sent_at: string | null
          invite_status: string | null
          last_login_at: string | null
          role: string | null
        }
        Relationships: []
      }
      invited_staff_view_v2: {
        Row: {
          account_id: string | null
          created_at: string | null
          email: string | null
          has_logged_in: boolean | null
          id: string | null
          invite_sent_at: string | null
          invite_status: string | null
          last_login_at: string | null
          role: string | null
        }
        Relationships: []
      }
      invited_staff_view_v3: {
        Row: {
          account_id: string | null
          created_at: string | null
          email: string | null
          has_logged_in: boolean | null
          id: string | null
          invite_sent_at: string | null
          invite_status: string | null
          last_login_at: string | null
          role: string | null
        }
        Relationships: []
      }
      invoice_share_tokens_public_1: {
        Row: {
          expires_at: string | null
          invoice_id: string | null
          token: string | null
        }
        Insert: {
          expires_at?: string | null
          invoice_id?: string | null
          token?: string | null
        }
        Update: {
          expires_at?: string | null
          invoice_id?: string | null
          token?: string | null
        }
        Relationships: []
      }
      products_unified: {
        Row: {
          account_id: string | null
          channel_id: string | null
          id: string | null
          name: string | null
          price: number | null
          quantity_available: number | null
          sku: string | null
          source: string | null
        }
        Insert: {
          account_id?: string | null
          channel_id?: string | null
          id?: string | null
          name?: string | null
          price?: number | null
          quantity_available?: number | null
          sku?: string | null
          source?: never
        }
        Update: {
          account_id?: string | null
          channel_id?: string | null
          id?: string | null
          name?: string | null
          price?: number | null
          quantity_available?: number | null
          sku?: string | null
          source?: never
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      users_minimal: {
        Row: {
          account_id: string | null
          email: string | null
          id: string | null
          role: string | null
        }
        Insert: {
          account_id?: string | null
          email?: string | null
          id?: string | null
          role?: string | null
        }
        Update: {
          account_id?: string | null
          email?: string | null
          id?: string | null
          role?: string | null
        }
        Relationships: []
      }
      v_billing_reconciliation: {
        Row: {
          billed_amount: number | null
          client_account_id: string | null
          client_name: string | null
          description: string | null
          diff: number | null
          invoice_id: string | null
          invoice_status: string | null
          line_type: string | null
          order_amount: number | null
          order_date: string | null
          order_id: string | null
          period_end: string | null
          period_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "billing_invoices_client_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_billing_service_rates: {
        Row: {
          description: string | null
          monthly_units_max: number | null
          monthly_units_min: number | null
          parent_account_id: string | null
          price_per_cuft_usd: number | null
          pricing_model: string | null
          range_unit_cuft_max: number | null
          range_unit_cuft_min: number | null
          rate_flat_usd: number | null
          rate_pct: number | null
          rate_per_unit_usd: number | null
          service_code: string | null
          service_group: string | null
          sort_order: number | null
          tier_volume_cuft_max: number | null
          tier_volume_cuft_min: number | null
          unit: string | null
          units_per_order_max: number | null
          units_per_order_min: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      v_billing_usage_outbound: {
        Row: {
          billable_weight_lb: number | null
          carrier: string | null
          client_account_id: string | null
          created_at: string | null
          customer_name: string | null
          id: string | null
          line_count: number | null
          marketplace: string | null
          order_date: string | null
          order_id: string | null
          package_count: number | null
          parent_account_id: string | null
          payment_status: number | null
          service: string | null
          ship_date: string | null
          shipping_status: number | null
          shipping_weight_lb: number | null
          snapshot_date: string | null
          source: string | null
          status_code: number | null
          tracking_numbers: string[] | null
          unit_count: number | null
          updated_at: string | null
          volume_cuft: number | null
          warehouse_id: string | null
        }
        Insert: {
          billable_weight_lb?: number | null
          carrier?: string | null
          client_account_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string | null
          line_count?: number | null
          marketplace?: string | null
          order_date?: string | null
          order_id?: string | null
          package_count?: number | null
          parent_account_id?: string | null
          payment_status?: number | null
          service?: string | null
          ship_date?: string | null
          shipping_status?: number | null
          shipping_weight_lb?: number | null
          snapshot_date?: string | null
          source?: string | null
          status_code?: number | null
          tracking_numbers?: string[] | null
          unit_count?: number | null
          updated_at?: string | null
          volume_cuft?: number | null
          warehouse_id?: string | null
        }
        Update: {
          billable_weight_lb?: number | null
          carrier?: string | null
          client_account_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string | null
          line_count?: number | null
          marketplace?: string | null
          order_date?: string | null
          order_id?: string | null
          package_count?: number | null
          parent_account_id?: string | null
          payment_status?: number | null
          service?: string | null
          ship_date?: string | null
          shipping_status?: number | null
          shipping_weight_lb?: number | null
          snapshot_date?: string | null
          source?: string | null
          status_code?: number | null
          tracking_numbers?: string[] | null
          unit_count?: number | null
          updated_at?: string | null
          volume_cuft?: number | null
          warehouse_id?: string | null
        }
        Relationships: []
      }
      v_billing_warehouses: {
        Row: {
          city: string | null
          id: string | null
          is_active: boolean | null
          is_default: boolean | null
          name: string | null
          parent_account_id: string | null
          source: string | null
          state: string | null
          wms_facility_id: string | null
        }
        Insert: {
          city?: string | null
          id?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string | null
          parent_account_id?: string | null
          source?: string | null
          state?: string | null
          wms_facility_id?: string | null
        }
        Update: {
          city?: string | null
          id?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string | null
          parent_account_id?: string | null
          source?: string | null
          state?: string | null
          wms_facility_id?: string | null
        }
        Relationships: []
      }
      v_client_warehouses: {
        Row: {
          billing_active: boolean | null
          billing_client_id: string | null
          billing_method: string | null
          client_account_id: string | null
          client_facilities: Json | null
          client_is_active: boolean | null
          client_name: string | null
          config_created_at: string | null
          config_id: string | null
          config_is_active: boolean | null
          currency_code: string | null
          parent_account_id: string | null
          sellercloud_warehouse_id: string | null
          warehouse_city: string | null
          warehouse_id: string | null
          warehouse_is_active: boolean | null
          warehouse_is_default: boolean | null
          warehouse_name: string | null
          warehouse_source: string | null
          warehouse_state: string | null
          wms_customer_id: string | null
          wms_facility_id: string | null
        }
        Relationships: []
      }
      v_extensiv_orders_dashboard: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          creation_date: string | null
          dashboard_date: string | null
          external_id: string | null
          facility_name: string | null
          id: number | null
          last_event_name: string | null
          last_event_type: string | null
          order_number: string | null
          process_date: string | null
          status: number | null
          status_closed: boolean | null
          status_fully_allocated: boolean | null
        }
        Insert: {
          account_id?: string | null
          account_id_channel?: string | null
          creation_date?: string | null
          dashboard_date?: never
          external_id?: string | null
          facility_name?: string | null
          id?: number | null
          last_event_name?: string | null
          last_event_type?: string | null
          order_number?: string | null
          process_date?: string | null
          status?: number | null
          status_closed?: boolean | null
          status_fully_allocated?: boolean | null
        }
        Update: {
          account_id?: string | null
          account_id_channel?: string | null
          creation_date?: string | null
          dashboard_date?: never
          external_id?: string | null
          facility_name?: string | null
          id?: number | null
          last_event_name?: string | null
          last_event_type?: string | null
          order_number?: string | null
          process_date?: string | null
          status?: number | null
          status_closed?: boolean | null
          status_fully_allocated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_channel_fkey"
            columns: ["account_id_channel"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "extensiv_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_inbound_volume: {
        Row: {
          client_id: string | null
          day: string | null
          inbound_cft: number | null
        }
        Relationships: []
      }
      v_magaya_orders: {
        Row: {
          account_id: string | null
          channel_id: string | null
          created_at: string | null
          currency_code: string | null
          customer_external_id: string | null
          customer_name: string | null
          external_id: string | null
          grand_total: number | null
          id: string | null
          last_synced_at: string | null
          order_date: string | null
          order_number: string | null
          process_date: string | null
          ship_date: string | null
          source_updated_at: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          customer_external_id?: string | null
          customer_name?: string | null
          external_id?: string | null
          grand_total?: number | null
          id?: string | null
          last_synced_at?: string | null
          order_date?: string | null
          order_number?: string | null
          process_date?: string | null
          ship_date?: string | null
          source_updated_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          currency_code?: string | null
          customer_external_id?: string | null
          customer_name?: string | null
          external_id?: string | null
          grand_total?: number | null
          id?: string | null
          last_synced_at?: string | null
          order_date?: string | null
          order_number?: string | null
          process_date?: string | null
          ship_date?: string | null
          source_updated_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_orders_for_billing_recon: {
        Row: {
          client_account_id: string | null
          client_name: string | null
          company_ref: string | null
          grand_total: number | null
          order_date: string | null
          order_id: string | null
          payment_status: number | null
          sc_order_pk: string | null
          shipping_status: number | null
          status_code: number | null
          warehouse_account_id: string | null
        }
        Insert: {
          client_account_id?: string | null
          client_name?: string | null
          company_ref?: never
          grand_total?: number | null
          order_date?: string | null
          order_id?: string | null
          payment_status?: number | null
          sc_order_pk?: string | null
          shipping_status?: number | null
          status_code?: number | null
          warehouse_account_id?: string | null
        }
        Update: {
          client_account_id?: string | null
          client_name?: string | null
          company_ref?: never
          grand_total?: number | null
          order_date?: string | null
          order_id?: string | null
          payment_status?: number | null
          sc_order_pk?: string | null
          shipping_status?: number | null
          status_code?: number | null
          warehouse_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_outbound_volume: {
        Row: {
          client_id: string | null
          day: string | null
          outbound_cft: number | null
        }
        Relationships: []
      }
      v_peak_inventory_monthly: {
        Row: {
          client_id: string | null
          month: string | null
          peak_cft: number | null
        }
        Relationships: []
      }
      v_products_with_cft: {
        Row: {
          client_account_id: string | null
          product_name: string | null
          quantity_available: number | null
          sku: string | null
          unit_cft: number | null
          warehouse_account_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["warehouse_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_sellercloud_order_draft_mapping: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_match_strategy: string | null
          client_name: string | null
          created_at: string | null
          mapped_billing_warehouse_id: string | null
          mapped_client_account_id: string | null
          mapped_client_name: string | null
          mapped_client_wms_customer_id: string | null
          mapped_public_warehouse_id: string | null
          mapped_warehouse_city: string | null
          mapped_warehouse_country: string | null
          mapped_warehouse_name: string | null
          mapped_warehouse_state: string | null
          mapped_warehouse_zip_code: string | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          parent_account_id: string | null
          sellercloud_client_id: string | null
          sellercloud_company_id: string | null
          sellercloud_customer_id: string | null
          sellercloud_ship_from_warehouse_id: number | null
          source_order_uuid: string | null
          source_table: string | null
          warehouse_match_strategy: string | null
        }
        Relationships: []
      }
      v_shipped_units_daily: {
        Row: {
          client_id: string | null
          day: string | null
          shipped_units: number | null
          sku: string | null
        }
        Relationships: []
      }
      v_warehouses: {
        Row: {
          account_id: string | null
          address_line1: string | null
          address_line2: string | null
          billing_warehouse_id: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          email: string | null
          extensiv_facility_id: string | null
          is_default: boolean | null
          metadata: Json | null
          name: string | null
          phone: string | null
          public_warehouse_id: string | null
          sellercloud_warehouse_id: number | null
          state: string | null
          zip_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_all_order_items_unified: {
        Row: {
          id: string | null
          order_id: string | null
          quantity: number | null
          sku: string | null
          source: string | null
          unit_price: number | null
        }
        Insert: {
          id?: string | null
          order_id?: string | null
          quantity?: number | null
          sku?: string | null
          source?: never
          unit_price?: number | null
        }
        Update: {
          id?: string | null
          order_id?: string | null
          quantity?: number | null
          sku?: string | null
          source?: never
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ai_orders_unified_6"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud_1"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "get_sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_for_billing_recon"
            referencedColumns: ["sc_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "view_all_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "view_sellercloud_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      view_all_order_items_unified_v2: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          height: string | null
          id: string | null
          length: string | null
          line_total: string | null
          marketplace_order_id: string | null
          order_id: string | null
          product_name: string | null
          quantity: number | null
          quantity_shipped: string | null
          sellercloud_order_id: string | null
          ship_from_warehouse: string | null
          shipping_cost: string | null
          site_price: string | null
          sku: string | null
          source: string | null
          unit_price: number | null
          weight: string | null
          width: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ai_orders_unified_6"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud_1"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "get_sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_for_billing_recon"
            referencedColumns: ["sc_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "view_all_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "view_sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_all_orders: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          id: string | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          order_status: string | null
          payment_status: string | null
          shipping_status: string | null
          source: string | null
          status_code: number | null
        }
        Insert: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          id?: string | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          order_status?: never
          payment_status?: never
          shipping_status?: never
          source?: never
          status_code?: number | null
        }
        Update: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          id?: string | null
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          order_status?: never
          payment_status?: never
          shipping_status?: never
          source?: never
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_all_orders_v2: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          logo: string | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_status: string | null
          payment_status: string | null
          shipping_status: string | null
          source: string | null
        }
        Relationships: []
      }
      view_all_orders_v3: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          logo: string | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_status: string | null
          payment_status: string | null
          shipping_status: string | null
          source: string | null
        }
        Insert: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          logo?: never
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_status?: never
          payment_status?: never
          shipping_status?: never
          source?: never
        }
        Update: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          logo?: never
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_status?: never
          payment_status?: never
          shipping_status?: never
          source?: never
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_all_orders_v4: {
        Row: {
          account_id: string | null
          channel_account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          logo: string | null
          marketplace_code: string | null
          marketplace_name: string | null
          order_date: string | null
          order_id: string | null
          order_status: string | null
          payment_status: string | null
          shipping_status: string | null
          source: string | null
        }
        Insert: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          logo?: never
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_status?: never
          payment_status?: never
          shipping_status?: never
          source?: never
        }
        Update: {
          account_id?: string | null
          channel_account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          logo?: never
          marketplace_code?: never
          marketplace_name?: never
          order_date?: string | null
          order_id?: string | null
          order_status?: never
          payment_status?: never
          shipping_status?: never
          source?: never
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_debug_access: {
        Row: {
          is_current_user: boolean | null
          is_direct_match: boolean | null
          is_parent_match: boolean | null
          order_account_id: string | null
          order_uuid: string | null
          parent_account_id: string | null
          user_account_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["order_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["order_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["order_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["order_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["order_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["order_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_fallback_product_data_sc: {
        Row: {
          account_id: string | null
          avg_unit_price: number | null
          channel_account_id: string | null
          height: number | null
          length: number | null
          quantity_available: number | null
          samples_count: number | null
          sku: string | null
          weight: number | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_channel_fkey"
            columns: ["channel_account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_logistics_lead_time: {
        Row: {
          destination_country: string | null
          domestic_handling_origin_days: number | null
          domestic_transport_destination_days: number | null
          export_clearance_days: number | null
          id: string | null
          import_clearance_days: number | null
          international_transit_days: number | null
          lead_time_adjustment_days: number | null
          notes: string | null
          receiving_days: number | null
          season: string | null
          total_lead_time: number | null
          transport_mode: string | null
        }
        Insert: {
          destination_country?: string | null
          domestic_handling_origin_days?: number | null
          domestic_transport_destination_days?: number | null
          export_clearance_days?: number | null
          id?: string | null
          import_clearance_days?: number | null
          international_transit_days?: number | null
          lead_time_adjustment_days?: number | null
          notes?: string | null
          receiving_days?: number | null
          season?: never
          total_lead_time?: number | null
          transport_mode?: string | null
        }
        Update: {
          destination_country?: string | null
          domestic_handling_origin_days?: number | null
          domestic_transport_destination_days?: number | null
          export_clearance_days?: number | null
          id?: string | null
          import_clearance_days?: number | null
          international_transit_days?: number | null
          lead_time_adjustment_days?: number | null
          notes?: string | null
          receiving_days?: number | null
          season?: never
          total_lead_time?: number | null
          transport_mode?: string | null
        }
        Relationships: []
      }
      view_logistics_lead_time_by_client: {
        Row: {
          channel_id: string | null
          channel_name: string | null
          destination_country: string | null
          notes: string | null
          season: string | null
          total_lead_time: number | null
          transport_mode: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: []
      }
      view_order_items_with_dimensions: {
        Row: {
          height: number | null
          item_id: string | null
          length: number | null
          metadata: Json | null
          order_id: string | null
          order_uuid: string | null
          quantity: number | null
          sku: string | null
          total_price: number | null
          unit_price: number | null
          weight: number | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "ai_orders_unified_6"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "b1_v_orders_extensiv_sellercloud_1"
            referencedColumns: ["sellercloud_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "get_sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "sellercloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "v_orders_for_billing_recon"
            referencedColumns: ["sc_order_pk"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_all_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_debug_access"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sellercloud_order_items_order_uuid_fkey"
            columns: ["order_uuid"]
            isOneToOne: false
            referencedRelation: "view_sellercloud_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      view_products_dashboard: {
        Row: {
          account_id: string | null
          channel_id: string | null
          company: string | null
          created_at: string | null
          dimensions: string | null
          enabled_on_channels: number[] | null
          id: string | null
          image_url: string | null
          product_name: string | null
          product_type: string | null
          quantity_available: number | null
          quantity_physical: number | null
          site_price: number | null
          sku: string | null
          source: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_products_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_sales_with_marketplace: {
        Row: {
          account_id: string | null
          date: string | null
          marketplace_name: string | null
          total_revenue: number | null
          total_sold: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_sellercloud_orders: {
        Row: {
          account_id: string | null
          client_name: string | null
          created_at: string | null
          grand_total: number | null
          id: string | null
          order_date: string | null
          order_id: string | null
          order_source_order_id: string | null
          payment_status: string | null
          shipping_status: string | null
          status: string | null
        }
        Insert: {
          account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          id?: string | null
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          payment_status?: never
          shipping_status?: never
          status?: never
        }
        Update: {
          account_id?: string | null
          client_name?: string | null
          created_at?: string | null
          grand_total?: number | null
          id?: string | null
          order_date?: string | null
          order_id?: string | null
          order_source_order_id?: string | null
          payment_status?: never
          shipping_status?: never
          status?: never
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_sku_sales_per_day: {
        Row: {
          account_id: string | null
          client_name: string | null
          date: string | null
          sku: string | null
          total_revenue: number | null
          total_sold: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_account_shipping_lead_times"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "b1_v_billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "get_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "view_logistics_lead_time_by_client"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sellercloud_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "vw_products_master_enriched"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_storage_volume_client_daily: {
        Row: {
          client_account_id: string | null
          distinct_skus: number | null
          parent_account_id: string | null
          snapshot_date: string | null
          total_allocated_units: number | null
          total_available_units: number | null
          total_on_hold_units: number | null
          total_units: number | null
          total_volume_cuft: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      vw_products_master_enriched: {
        Row: {
          account_external_id: string | null
          account_id: string | null
          account_name: string | null
          account_source: string | null
          account_status: string | null
          allocated: number | null
          available: number | null
          billing_method: string | null
          carton_units: number | null
          client_account_id: string | null
          client_id: string | null
          client_is_active: boolean | null
          client_name: string | null
          client_source: string | null
          created_at: string | null
          description: string | null
          external_ids: string[] | null
          facility_id: string | null
          has_item_storage_rate: boolean | null
          id: string | null
          inventory_by_warehouse: Json | null
          inventory_snapshot_date: string | null
          inventory_source: string | null
          inventory_warehouse_id: string | null
          inventory_warehouse_name: string | null
          is_wrapping: boolean | null
          on_hand: number | null
          on_hold: number | null
          parent_account_id: string | null
          pkg_height_in: number | null
          pkg_length_in: number | null
          pkg_weight_lb: number | null
          pkg_width_in: number | null
          product_source: string | null
          quarantined: boolean | null
          sku: string | null
          source_item_id: string | null
          storage_daily_id: string | null
          total_received: number | null
          track_serial: boolean | null
          unit_volume_cuft: number | null
          unit_weight_lb: number | null
          uom: string | null
          upc: string | null
          updated_at: string | null
          volume_cuft: number | null
          warehouse_id: string | null
          warehouse_name: string | null
          wms_customer_id: string | null
        }
        Relationships: []
      }
      vw_sku_panorama: {
        Row: {
          allocated: number | null
          available: number | null
          avg_outflow_30d: number | null
          avg_outflow_7d: number | null
          client_account_id: string | null
          daily_outflow_est: number | null
          days_of_cover_30d: number | null
          days_of_cover_7d: number | null
          facility_id: string | null
          item_description: string | null
          last_snapshot_date: string | null
          lead_time_days: number | null
          on_hand: number | null
          on_hold: number | null
          parent_account_id: string | null
          reorder_by_date_30d: string | null
          reorder_by_date_7d: string | null
          sku: string | null
          source: string | null
          stockout_date_30d: string | null
          stockout_date_7d: string | null
          total_received: number | null
          warehouse_id: string | null
        }
        Relationships: []
      }
      xlei_v_billing_clients: {
        Row: {
          client_account_id: string | null
          is_active: boolean | null
          name: string | null
          parent_account_id: string | null
          warehouse_id: string | null
          wms_customer_id: string | null
        }
        Insert: {
          client_account_id?: string | null
          is_active?: boolean | null
          name?: string | null
          parent_account_id?: string | null
          warehouse_id?: string | null
          wms_customer_id?: string | null
        }
        Update: {
          client_account_id?: string | null
          is_active?: boolean | null
          name?: string | null
          parent_account_id?: string | null
          warehouse_id?: string | null
          wms_customer_id?: string | null
        }
        Relationships: []
      }
      xlei_v_products_effective: {
        Row: {
          client_account_id: string | null
          sku: string | null
          volume_cuft_effective: number | null
          weight_lb_effective: number | null
        }
        Insert: {
          client_account_id?: string | null
          sku?: string | null
          volume_cuft_effective?: number | null
          weight_lb_effective?: number | null
        }
        Update: {
          client_account_id?: string | null
          sku?: string | null
          volume_cuft_effective?: number | null
          weight_lb_effective?: number | null
        }
        Relationships: []
      }
      xlei_v_warehouses: {
        Row: {
          id: string | null
          parent_account_id: string | null
          wms_facility_id: string | null
        }
        Insert: {
          id?: string | null
          parent_account_id?: string | null
          wms_facility_id?: string | null
        }
        Update: {
          id?: string | null
          parent_account_id?: string | null
          wms_facility_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      b1_get_billing_dashboard: {
        Args: { p_limit_unclassified?: number; p_parent: string }
        Returns: Json
      }
      b1_get_billing_dashboard_: {
        Args: { p_month?: string; p_parent: string }
        Returns: Json
      }
      b1_get_billing_dashboard__impl: {
        Args: { p_month?: string; p_parent: string }
        Returns: {
          kpis: Json
          parent_account_id: string
          unclassified_events: Json
          upcoming_invoices: Json
          warehouses: Json
        }[]
      }
      b1_get_billing_dashboard_b: {
        Args: { p_month?: string; p_parent: string }
        Returns: Json
      }
      b1_set_client_service_override: {
        Args: {
          p_client: string
          p_notes?: string
          p_parent: string
          p_rate_cents: number
          p_service: string
          p_warehouse: string
        }
        Returns: undefined
      }
      b1_set_client_service_visibility: {
        Args: {
          p_client: string
          p_parent: string
          p_service: string
          p_visible: boolean
          p_warehouse: string
        }
        Returns: undefined
      }
      b1_storage_snapshot: {
        Args: {
          p_client_account_id?: string
          p_parent_account_id?: string
          p_snapshot_date: string
        }
        Returns: {
          amount_usd: number
          client_account_id: string
          parent_account_id: string
          rate_usd_per_cuft: number
          snapshot_date: string
          total_volume_cuft: number
          warehouse_id: string
        }[]
      }
      b1_storage_snapshot_1: {
        Args: {
          p_client_account_id?: string
          p_parent_account_id?: string
          p_snapshot_date: string
        }
        Returns: {
          amount_usd: number
          client_account_id: string
          parent_account_id: string
          rate_usd_per_cuft: number
          snapshot_date: string
          total_volume_cuft: number
          warehouse_id: string
        }[]
      }
      b1_unset_client_service_override: {
        Args: {
          p_client: string
          p_notes?: string
          p_parent: string
          p_service: string
          p_warehouse: string
        }
        Returns: undefined
      }
      b1_usage_monthly_summary: {
        Args: { p_from?: string; p_parent: string; p_to?: string }
        Returns: {
          amount_usd: number
          bucket: string
          client_account_id: string
          month: string
          parent_account_id: string
          qty: number
          warehouse_id: string
          warehouse_key_text: string
        }[]
      }
      billing_add_invoice_service_item_1: {
        Args: {
          p_global_service_id: string
          p_invoice_id: string
          p_occurred_at?: string
          p_qty: number
          p_rate_cents?: number
        }
        Returns: unknown[]
        SetofOptions: {
          from: "*"
          to: "invoice_items_1"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      billing_create_invoice_2: {
        Args: {
          p_client_account_id: string
          p_currency_code: string
          p_parent_account_id: string
          p_period_end: string
          p_period_start: string
          p_warehouse_id: string
        }
        Returns: string
      }
      billing_create_invoice_3: {
        Args: {
          p_client_account_id: string
          p_currency_code: string
          p_parent_account_id: string
          p_period_end: string
          p_period_start: string
          p_warehouse_id: string
        }
        Returns: string
      }
      billing_create_invoice_4: {
        Args: {
          p_client_account_id: string
          p_currency_code: string
          p_parent_account_id: string
          p_period_end: string
          p_period_start: string
          p_warehouse_id: string
        }
        Returns: string
      }
      billing_create_invoice_5: {
        Args: {
          p_client_account_id: string
          p_currency_code: string
          p_parent_account_id: string
          p_period_end: string
          p_period_start: string
          p_warehouse_id: string
        }
        Returns: string
      }
      billing_delete_invoice_1: {
        Args: { p_invoice_id: string }
        Returns: Json
      }
      billing_delete_invoice_item_1: {
        Args: { p_invoice_item_id: string }
        Returns: undefined
      }
      billing_get_warehouses: {
        Args: { p_parent_account_id: string }
        Returns: {
          id: string
          is_active: boolean
          parent_account_id: string
          wms_facility_id: string
        }[]
      }
      billing_invoice_issue_1: { Args: { p_invoice_id: string }; Returns: Json }
      billing_invoice_share_generate_1: {
        Args: { p_invoice_id: string; p_valid_for_days?: number }
        Returns: Json
      }
      billing_invoice_share_revoke_1: {
        Args: { p_token: string }
        Returns: undefined
      }
      billing_rebuild_inbound_received_daily_1: {
        Args: {
          p_client_account_id: string
          p_end_date: string
          p_parent_account_id: string
          p_start_date: string
          p_warehouse_id: string
        }
        Returns: Json
      }
      billing_storage_daily_bulk_upsert: {
        Args: { rows: Json }
        Returns: undefined
      }
      billing_update_products_cursor: {
        Args: {
          p_client_account_id: string
          p_last_modified: string
          p_parent_account_id: string
        }
        Returns: undefined
      }
      billing_upsert_clients: { Args: { rows: Json }; Returns: Json }
      billing_upsert_configs: { Args: { rows: Json }; Returns: Json }
      billing_upsert_products_master: { Args: { rows: Json }; Returns: Json }
      billing_upsert_products_master_from_extensiv_n: {
        Args: { p_parent_account_id: string }
        Returns: undefined
      }
      billing_usage_inbound_upsert: { Args: { rows: Json }; Returns: number }
      call_process_triggers: { Args: never; Returns: undefined }
      call_refresh_tokens: { Args: never; Returns: undefined }
      compare_sku_sales_by_period: {
        Args: {
          end_date: string
          prev_end_date: string
          prev_start_date: string
          sku_input: string
          start_date: string
        }
        Returns: {
          period_revenue: number
          period_units: number
          previous_revenue: number
          previous_units: number
        }[]
      }
      compare_sku_sales_by_period_: {
        Args: {
          account_id: string
          end_date: string
          prev_end_date: string
          prev_start_date: string
          sku_input: string
          start_date: string
          user_type: string
        }
        Returns: {
          period_revenue: number
          period_units: number
          previous_revenue: number
          previous_units: number
        }[]
      }
      debug_auth_context: { Args: never; Returns: Json }
      estimate_stockout: {
        Args: {
          account_id_input: string
          days_range?: number
          sku_input: string
        }
        Returns: Json
      }
      exe_sql_query: { Args: { query: string }; Returns: Json[] }
      get_account_id_from_auth: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_products_at_risk:
        | {
            Args: { account_id: string; days_ahead: number }
            Returns: {
              avg_daily_sales: number
              estimated_coverage_days: number
              product_name: string
              quantity_available: number
              sku: string
            }[]
          }
        | {
            Args: {
              account_id: string
              days_ahead: number
              sales_window_days?: number
            }
            Returns: {
              avg_daily_sales: number
              estimated_coverage_days: number
              product_name: string
              quantity_available: number
              sku: string
            }[]
          }
      get_products_at_risk_turbo:
        | {
            Args: {
              account_id: string
              days_ahead: number
              sales_window_days?: number
            }
            Returns: {
              at_risk: boolean
              avg_daily_sales: number
              estimated_coverage_days: number
              estimated_stockout_date: string
              product_name: string
              quantity_available: number
              sku: string
              urgency_level: string
            }[]
          }
        | {
            Args: { days_ahead: number; sales_window_days?: number }
            Returns: {
              at_risk: boolean
              avg_daily_sales: number
              estimated_coverage_days: number
              estimated_stockout_date: string
              product_name: string
              quantity_available: number
              sku: string
              urgency_level: string
            }[]
          }
      invoice_item_update_1: {
        Args: {
          p_description?: string
          p_item_id: string
          p_occurred_at?: string
          p_qty?: number
          p_rate_cents?: number
        }
        Returns: Json
      }
      invoice_usage_pending_warehouses: {
        Args: {
          p_client_account_id: string
          p_parent_account_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: {
          warehouse_id: string
        }[]
      }
      invoice_usage_unified: {
        Args: {
          p_client_account_id: string
          p_parent_account_id: string
          p_period_end: string
          p_period_start: string
          p_warehouse_id?: string
        }
        Returns: {
          amount_usd: number
          category: string
          client_account_id: string
          description: string
          invoice_section_key: string
          invoice_section_label: string
          order_id: string
          parent_account_id: string
          qty: number
          rate_usd: number
          sellercloud_cs_key: string
          snapshot_date: string
          source: string
          source_type: string
          status: string
          type_label: string
          unit: string
          usage_id: string
          warehouse_id: string
        }[]
      }
      list_staff_with_auth_status: {
        Args: never
        Returns: {
          accepted: boolean
          created_at: string
          email: string
          id: string
          role: string
        }[]
      }
      process_extensiv_order_webhooks: {
        Args: { batch_size?: number }
        Returns: number
      }
      raw_sql: { Args: { sql: string }; Returns: Json }
      run_dynamic_sql: { Args: { query: string }; Returns: Json }
      run_storage_snap: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      summarize_orders_by_period:
        | {
            Args: {
              p_account_id: string
              p_end_date: string
              p_start_date: string
              p_user_type: string
            }
            Returns: {
              status: string
              total_orders: number
              total_revenue: number
            }[]
          }
        | {
            Args: { end_date: string; start_date: string }
            Returns: {
              marketplace_name: string
              status: string
              total_orders: number
            }[]
          }
      summarize_orders_by_period_by_marketplace: {
        Args: { p_account_id: string; p_end_date: string; p_start_date: string }
        Returns: {
          marketplace_name: string
          total_orders: number
          total_value: number
        }[]
      }
      summarize_orders_overview:
        | {
            Args: { end_date: string; start_date: string }
            Returns: {
              status: string
              total_orders: number
              total_revenue: number
            }[]
          }
        | {
            Args: {
              account_id: string
              end_date: string
              start_date: string
              user_type: string
            }
            Returns: {
              status: string
              total_orders: number
              total_revenue: number
            }[]
          }
      summarize_sales_by_period:
        | {
            Args: {
              p_account_id: string
              p_end_date: string
              p_start_date: string
              p_user_type: string
            }
            Returns: {
              total_orders: number
              total_revenue: number
            }[]
          }
        | {
            Args: { end_date: string; start_date: string }
            Returns: {
              total_orders: number
              total_revenue: number
            }[]
          }
      util_cubic_feet: {
        Args: { height_in: number; length_in: number; width_in: number }
        Returns: number
      }
      view_all_orders: {
        Args: never
        Returns: {
          account_id: string
          client_name: string
          id: string
          marketplace: number
          order_date: string
          order_id: string
          status: number
          total_amount: number
        }[]
      }
    }
    Enums: {
      address_type: "shipping" | "billing"
      channel_source:
        | "sellercloud"
        | "extensiv"
        | "woocommerce"
        | "manual"
        | "magaya"
      inventory_movement_reason:
        | "initial_snapshot"
        | "import_delta"
        | "manual_adjustment"
        | "order_allocation"
        | "order_shipment"
        | "purchase_receipt"
        | "return_receipt"
        | "transfer_in"
        | "transfer_out"
        | "correction"
      user_role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER" | "CLIENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      address_type: ["shipping", "billing"],
      channel_source: [
        "sellercloud",
        "extensiv",
        "woocommerce",
        "manual",
        "magaya",
      ],
      inventory_movement_reason: [
        "initial_snapshot",
        "import_delta",
        "manual_adjustment",
        "order_allocation",
        "order_shipment",
        "purchase_receipt",
        "return_receipt",
        "transfer_in",
        "transfer_out",
        "correction",
      ],
      user_role: ["SUPER_ADMIN", "ADMIN", "CUSTOMER", "CLIENT"],
    },
  },
} as const
