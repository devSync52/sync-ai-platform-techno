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
  account_id: string
  channel_id: string | null
  source: string
  sku: string
  product_name: string | null
  image_url: string | null
  quantity_available: number | null
  quantity_physical: number | null
  warehouse_name: string | null
  company: string | null
  site_price: number | null
  enabled_on_channels: number[] | null
  dimensions: string | null
  is_active: boolean
  product_type: string | null
  created_at: string
}