export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_integrations: {
        Row: {
          account_id: string
          created_at: string | null
          credentials: Json | null
          id: string
          last_synced_at: string | null
          metadata: Json | null
          name: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credentials?: Json | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credentials?: Json | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
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
      billing_configs: {
        Row: {
          id: string
          client_id: string
          assigned_warehouse: string | null
          billing_frequency: string | null
          monthly_billing_day: number | null
          rate_card_id: string | null
          enabled_services: string[] | null
        }
        Insert: {
          id?: string
          client_id: string
          assigned_warehouse?: string | null
          billing_frequency?: string | null
          monthly_billing_day?: number | null
          rate_card_id?: string | null
          enabled_services?: string[] | null
        }
        Update: {
          id?: string
          client_id?: string
          assigned_warehouse?: string | null
          billing_frequency?: string | null
          monthly_billing_day?: number | null
          rate_card_id?: string | null
          enabled_services?: string[] | null
        }
        Relationships: []
      }
      billing_clients: {
        Row: {
          id: string
          parent_account_id: string | null
          client_account_id: string | null
          name: string | null
          source: string | null
          wms_customer_id: string | null
          is_active: boolean | null
          warehouse_id: string | null
          warehouse_id_norm: string | null
        }
        Insert: {
          id?: string
          parent_account_id?: string | null
          client_account_id?: string | null
          name?: string | null
          source?: string | null
          wms_customer_id?: string | null
          is_active?: boolean | null
          warehouse_id?: string | null
          warehouse_id_norm?: string | null
        }
        Update: {
          id?: string
          parent_account_id?: string | null
          client_account_id?: string | null
          name?: string | null
          source?: string | null
          wms_customer_id?: string | null
          is_active?: boolean | null
          warehouse_id?: string | null
          warehouse_id_norm?: string | null
        }
        Relationships: []
      }
      billing_invoices: {
        Row: {
          id: string
          client_id: string
          period_start: string
          period_end: string
          status: string
          currency: string
          subtotal: number | null
          tax: number | null
          total: number | null
          generated_at: string | null
          delivered_at: string | null
          pdf_url: string | null
          meta: Json | null
          created_at: string | null
          updated_at: string | null
          warehouse_account_id: string | null
        }
        Insert: {
          id?: string
          client_id: string
          period_start: string
          period_end: string
          status: string
          currency: string
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          generated_at?: string | null
          delivered_at?: string | null
          pdf_url?: string | null
          meta?: Json | null
          created_at?: string | null
          updated_at?: string | null
          warehouse_account_id?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          period_start?: string
          period_end?: string
          status?: string
          currency?: string
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          generated_at?: string | null
          delivered_at?: string | null
          pdf_url?: string | null
          meta?: Json | null
          created_at?: string | null
          updated_at?: string | null
          warehouse_account_id?: string | null
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
          id: string
          logo: string | null
          name: string
          parent_account_id: string | null
          phone: string | null
          sellercloud_customer_id: string | null
          sellercloud_user_id: number | null
          slug: string | null
          source: string | null
          state: string | null
          status: string | null
          tax_id: string | null
          type_id: string | null
          updated_at: string | null
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
          id?: string
          logo?: string | null
          name: string
          parent_account_id?: string | null
          phone?: string | null
          sellercloud_customer_id?: string | null
          sellercloud_user_id?: number | null
          slug?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          type_id?: string | null
          updated_at?: string | null
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
          id?: string
          logo?: string | null
          name?: string
          parent_account_id?: string | null
          phone?: string | null
          sellercloud_customer_id?: string | null
          sellercloud_user_id?: number | null
          slug?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          type_id?: string | null
          updated_at?: string | null
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
            foreignKeyName: "accounts_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "account_types"
            referencedColumns: ["id"]
          },
        ]
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
        ]
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
        ]
      }
      clients: {
        Row: {
          account_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
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
      orders: {
        Row: {
          account_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          order_number: string | null
          origin: string | null
          status: string | null
          total: number | null
        }
        Insert: {
          account_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          order_number?: string | null
          origin?: string | null
          status?: string | null
          total?: number | null
        }
        Update: {
          account_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          order_number?: string | null
          origin?: string | null
          status?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
        ]
      }
      saip_quote_drafts: {
        Row: {
          account_id: string | null
          client: Json | null
          created_at: string | null
          id: string
          items: Json | null
          preferences: Json | null
          ship_from: Json | null
          ship_to: Json | null
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
          preferences?: Json | null
          ship_from?: Json | null
          ship_to?: Json | null
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
          preferences?: Json | null
          ship_from?: Json | null
          ship_to?: Json | null
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
            foreignKeyName: "saip_quote_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_users_view"
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
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
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
          sellercloud_customer_id: string | null
          sellercloud_user_id: number | null
          shipping_status: number | null
          status_code: number | null
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
          sellercloud_customer_id?: string | null
          sellercloud_user_id?: number | null
          shipping_status?: number | null
          status_code?: number | null
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
          sellercloud_customer_id?: string | null
          sellercloud_user_id?: number | null
          shipping_status?: number | null
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
        ]
      }
      sellercloud_products: {
      warehouses: {
        Row: {
          id: string;
          account_id: string | null;
          sellercloud_warehouse_id: number | null;
          name: string | null;
          code: string | null;
          is_default: boolean | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          zip_code: string | null;
          phone: string | null;
          email: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          sellercloud_warehouse_id?: number | null;
          name?: string | null;
          code?: string | null;
          is_default?: boolean | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          zip_code?: string | null;
          phone?: string | null;
          email?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          account_id?: string | null;
          sellercloud_warehouse_id?: number | null;
          name?: string | null;
          code?: string | null;
          is_default?: boolean | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          zip_code?: string | null;
          phone?: string | null;
          email?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
      };
        Row: {
          account_id: string | null
          asin: string | null
          average_cost: number | null
          brand: string | null
          brand_name: string | null
          buy_it_now_price: number | null
          channel_id: string | null
          company_id: number | null
          company_name: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          enabled_on_channels: number[] | null
          external_id: string
          gtin: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_end_of_life: boolean | null
          item_url: string | null
          list_price: number | null
          name: string | null
          package_weight_lbs: number | null
          package_weight_oz: number | null
          price: number | null
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
          upc: string | null
          updated_at: string | null
          warehouse_name: string | null
          weight: number | null
        }
        Insert: {
          account_id?: string | null
          asin?: string | null
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          buy_it_now_price?: number | null
          channel_id?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          enabled_on_channels?: number[] | null
          external_id: string
          gtin?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          item_url?: string | null
          list_price?: number | null
          name?: string | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
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
          upc?: string | null
          updated_at?: string | null
          warehouse_name?: string | null
          weight?: number | null
        }
        Update: {
          account_id?: string | null
          asin?: string | null
          average_cost?: number | null
          brand?: string | null
          brand_name?: string | null
          buy_it_now_price?: number | null
          channel_id?: string | null
          company_id?: number | null
          company_name?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          enabled_on_channels?: number[] | null
          external_id?: string
          gtin?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_end_of_life?: boolean | null
          item_url?: string | null
          list_price?: number | null
          name?: string | null
          package_weight_lbs?: number | null
          package_weight_oz?: number | null
          price?: number | null
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
          upc?: string | null
          updated_at?: string | null
          warehouse_name?: string | null
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
        ]
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
        ]
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
          last_login_at: string | null
          logo_url: string | null
          name: string | null
          phone: string | null
          role: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email: string
          has_logged_in?: boolean | null
          id?: string
          last_login_at?: string | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          role: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string
          has_logged_in?: boolean | null
          id?: string
          last_login_at?: string | null
          logo_url?: string | null
          name?: string | null
          phone?: string | null
          role?: string
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
            referencedRelation: "view_debug_access"
            referencedColumns: ["user_id"]
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
      ai_fulfillment_delays_extensiv: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          carrier: string | null
          creation_date: string | null
          delay_interval: unknown | null
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
        ]
      }
      ai_fulfillment_timing_extensiv: {
        Row: {
          account_id: string | null
          account_id_channel: string | null
          creation_date: string | null
          fulfillment_time: unknown | null
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
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
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
        Relationships: []
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
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
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
        ]
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
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
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
            referencedRelation: "ai_sellercloud_orders"
            referencedColumns: ["uuid"]
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
        ]
      }
      warehouses: {
        Row: {
          id: string
          account_id: string | null
          sellercloud_warehouse_id: number | null
          name: string | null
          code: string | null
          is_default: boolean | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          country: string | null
          zip_code: string | null
          phone: string | null
          email: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          account_id?: string | null
          sellercloud_warehouse_id?: number | null
          name?: string | null
          code?: string | null
          is_default?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          zip_code?: string | null
          phone?: string | null
          email?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          account_id?: string | null
          sellercloud_warehouse_id?: number | null
          name?: string | null
          code?: string | null
          is_default?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          zip_code?: string | null
          phone?: string | null
          email?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
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
        ]
      }
    }
    Functions: {
      compare_sku_sales_by_period: {
        Args:
          | {
              sku_input: string
              start_date: string
              end_date: string
              prev_start_date: string
              prev_end_date: string
            }
          | {
              sku_input: string
              start_date: string
              end_date: string
              prev_start_date: string
              prev_end_date: string
              account_id: string
              user_type: string
            }
        Returns: {
          period_units: number
          period_revenue: number
          previous_units: number
          previous_revenue: number
        }[]
      }
      estimate_stockout: {
        Args: {
          account_id_input: string
          sku_input: string
          days_range?: number
        }
        Returns: Json
      }
      exe_sql_query: {
        Args: { query: string }
        Returns: Json[]
      }
      get_account_id_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_products_at_risk: {
        Args:
          | { account_id: string; days_ahead: number }
          | {
              account_id: string
              days_ahead: number
              sales_window_days?: number
            }
        Returns: {
          sku: string
          product_name: string
          quantity_available: number
          avg_daily_sales: number
          estimated_coverage_days: number
        }[]
      }
      get_products_at_risk_turbo: {
        Args:
          | {
              account_id: string
              days_ahead: number
              sales_window_days?: number
            }
          | { days_ahead: number; sales_window_days?: number }
        Returns: {
          sku: string
          product_name: string
          quantity_available: number
          avg_daily_sales: number
          estimated_coverage_days: number
          estimated_stockout_date: string
          at_risk: boolean
          urgency_level: string
        }[]
      }
      list_staff_with_auth_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          role: string
          created_at: string
          accepted: boolean
        }[]
      }
      raw_sql: {
        Args: { sql: string }
        Returns: Json
      }
      run_dynamic_sql: {
        Args: { query: string }
        Returns: Json
      }
      summarize_orders_by_period: {
        Args: { start_date: string; end_date: string }
        Returns: {
          status: string
          marketplace_name: string
          total_orders: number
        }[]
      }
      summarize_orders_by_period_by_marketplace: {
        Args: { p_account_id: string; p_start_date: string; p_end_date: string }
        Returns: {
          marketplace_name: string
          total_orders: number
          total_value: number
        }[]
      }
      summarize_orders_overview: {
        Args:
          | { start_date: string; end_date: string }
          | {
              start_date: string
              end_date: string
              account_id: string
              user_type: string
            }
        Returns: {
          status: string
          total_orders: number
          total_revenue: number
        }[]
      }
      summarize_sales_by_period: {
        Args: { start_date: string; end_date: string }
        Returns: {
          total_orders: number
          total_revenue: number
        }[]
      }
      view_all_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          account_id: string
          order_id: string
          client_name: string
          total_amount: number
          order_date: string
          status: number
          marketplace: number
        }[]
      }
    }
    Enums: {
      channel_source: "sellercloud" | "extensiv" | "woocommerce" | "manual"
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
      channel_source: ["sellercloud", "extensiv", "woocommerce", "manual"],
    },
  },
} as const
