
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
}

export interface ChannelMarketplace {
  id: string
  channel_id: string
  marketplace_code: string
  marketplace_name: string
  logo_url: string | null
  created_at: string
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
        Row: {
          id: string
          channel_id: string
          email: string
          token: string
          status: string
          created_at: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}