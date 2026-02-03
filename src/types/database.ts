export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      billing_clients: {
        Row: {
          client_account_id: string
          parent_account_id: string
          warehouse_id: string | null
          company_name: string | null
          logo_url: string | null
          created_at: string | null
        }
        Insert: {
          client_account_id: string
          parent_account_id: string
          warehouse_id?: string | null
          company_name?: string | null
          logo_url?: string | null
          created_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["billing_clients"]["Insert"]>
      }

      billing_configs: {
        Row: {
          id: string
          parent_account_id: string
          client_account_id: string
          warehouse_id: string | null
          currency_code: string
          storage_rate_model: string
          storage_price_per_cuft_cents: number | null
          storage_price_per_lb_cents: number | null
          storage_price_per_unit_cents: number | null
          storage_price_per_pallet_day_cents: number | null
          free_storage_days: number | null
          snapshot_hour_utc: number | null
          monthly_minimum_cents: number | null
          dim_divisor: number | null
          default_volume_cuft: number | null
          default_weight_lb: number | null
          created_at: string | null
          is_active: boolean | null
          outbound_price_per_pack_cents: number | null
          outbound_price_per_line_cents: number | null
          outbound_price_per_unit_cents: number | null
          outbound_price_per_label_cents: number | null
          outbound_price_per_lb_cents: number | null
          outbound_min_order_cents: number | null
          rate_storage_usd_per_cuft: number | null

          // novos campos que você pediu
          billing_active: boolean | null
          billing_method: string | null
          discount_pct: number | null
          tax_exempt: boolean | null
          tax_id: string | null
          invoice_cycle: string | null
          cut_off_day: number | null
          template_primary_color: string | null
          rate_card_id: string | null
          enabled_services: Json | null
          secondary_warehouse_id: string | null
          min_monthly_fee_cents: number | null
        }
        Insert: Partial<Database["public"]["Tables"]["billing_configs"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["billing_configs"]["Row"]>
      }

      // VIEW usada no front
      billing_services_by_wh: {
        Row: {
          warehouse_id: string | null
          service_id: string
          category: string
          name: string
          unit: string
          default_rate_cents: number
          default_rate_usd: number
          active: boolean
        }
      }
    }

    Views: {
      // view de billing.configs mapeada como tabela de leitura
      billing_configs: {
        Row: Database["public"]["Tables"]["billing_configs"]["Row"]
      }

      b1_v_barcode_tiered_summary_by_client: {
        Row: {
          client_account_id: string
          cf_tier: string
          orders: number
          units: number
          rate_usd: number
          total_usd: number
        }
      }

      b1_v_storage_billing_daily: {
        Row: {
          snapshot_date: string
          parent_account_id: string
          client_account_id: string
          warehouse_id: string
          total_volume_cuft: number
          base_rate_usd_per_cuft_day: number
          surcharge_usd_per_cuft_day: number
          total_rate_usd_per_cuft_day: number
          amount_usd: number
        }
      }
    }

    Functions: {}
  }
}

// Resposta da API de rates (ShipEngine/ShipStation)
export type ShipEngineRate = {
  rate_type: string;
  carrier_id: string;
  shipping_amount: { currency: string; amount: number };
  insurance_amount: { currency: string; amount: number };
  confirmation_amount: { currency: string; amount: number };
  other_amount: { currency: string; amount: number };
  requested_comparison_amount?: { currency: string; amount: number };
  rate_details?: {
    rate_detail_type: string;
    carrier_description: string | null;
    carrier_billing_code: string | null;
    carrier_memo: string | null;
    amount: { currency: string; amount: number };
    billing_source: string;
  }[];
  zone?: number;
  package_type?: string;
  carrier_weight?: { value: number; unit: string } | null;
  delivery_days?: number | null;
  guaranteed_service?: boolean;
  estimated_delivery_date?: string | null;
  carrier_delivery_days?: string | null;
  ship_date?: string | null;
  negotiated_rate?: boolean;
  service_type: string;     // "USPS Ground Advantage"
  service_code: string;     // "usps_ground_advantage"
  trackable?: boolean;
  carrier_code: string;     // "usps", "ups", "fedex"
  carrier_nickname?: string | null;
  carrier_friendly_name?: string | null;
  display_scheme?: string | null;
  validation_status?: string;
  warning_messages?: string[];
  error_messages?: string[];
  rate_attributes?: string[]; // ["cheapest","fastest","best_value"]
};

export interface NormalizedRate {
  carrier: string;           // "USPS", "UPS", "FedEx"
  carrier_code: string;      // "usps"
  service_code: string;      // "usps_ground_advantage"
  service_name: string;      // "USPS Ground Advantage"
  display_name: string;      // nome final pra UI
  total: number;             // shipping + other + insurance + confirmation
  currency: string;          // "USD"
  delivery_days: number | null;
  delivery_date: string | null;
  zone: number | null;
  package_type: string | null;
  attributes: string[];      // ["cheapest"], ["fastest"], ["best_value"]
  source: 'shipengine';
  raw: ShipEngineRate;       // pra debug/auditoria
}