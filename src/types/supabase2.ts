export interface Channel {
    id: string
    account_id: string | null
    name: string
    email: string | null
    phone: string | null
    created_at: string | null
    external_id: string | null
    company_name: string | null
    contact_name: string | null
    address_line1: string | null
    address_line2: string | null
    city: string | null
    state: string | null
    zip_code: string | null
    country: string | null
    notes: string | null
    marketplace_name?: string | null
    imported_product_count?: number
    source: string
  }
  
  export interface ChannelMarketplace {
    id: string
    channel_id: string
    marketplace_code: string
    marketplace_name: string
    logo_url: string | null
    created_at: string
    source: string
  }
  
  export interface Invitation {
    id: string
    channel_id: string
    email: string
    token: string
    status: string
    created_at: string
  }
  
  export interface Account {
    id: string
    created_by_user_id: string
  }
  
  export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]
  
  export interface Database {
    public: {
      Tables: {
        channels: {
          Row: Channel
        }
        channel_marketplaces: {
          Row: ChannelMarketplace
        }
        invitations: {
          Row: Invitation
        }
        accounts: {
          Row: Account
        }
      }
      Views: Record<string, never>
      Functions: Record<string, never>
    }
  }
  
  export type ProductList = {
    id: string
    parent_account_id: string
    client_account_id: string
    sku: string
    upc: string | null
    description: string | null
    uom: string | null
    pkg_length_in: string | number | null
    pkg_width_in: string | number | null
    pkg_height_in: string | number | null
    pkg_weight_lb: string | number | null
    volume_cuft: string | number | null
    track_serial: boolean
    has_item_storage_rate: boolean
    product_source: string
    source_item_id: string | null
    created_at: string
    updated_at: string
    carton_units: string | number | null
    is_wrapping: boolean
    client_id: string
    client_name: string
    client_source: string
    wms_customer_id: string
    client_is_active: boolean
    warehouse_id: string
    billing_method: string | null
    external_ids: string[] | null
    account_id: string
    account_name: string
    account_external_id: string | null
    account_source: string
    account_status: string
    // Campos opcionais mantidos para compat com telas antigas
    image_url?: string | null
    quantity_available?: number | null
    quantity_physical?: number | null
    site_price?: number | null
    available?: number | null
    on_hold?: number | null
    warehouse_name?: string
  }
  
  export type CurrentUser = {
    id: string
    email: string
    role: string
    // 👇 adicione isso:
    account_id: string
  }