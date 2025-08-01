
export type QuoteDraft = {
    id: string;
    user_id?: string;
    account_id?: string;
    step?: number;
    client?: string;
    ship_from?: {
      name: string;
      address: {
        city: string;
        line1: string;
        line2?: string | null;
        state: string;
        country: string;
        zip_code: string;
      };
      contact?: {
        email?: string | null;
        phone?: string | null;
      };
      warehouse_id?: string;
    };
    ship_to?: {
      full_name: string;
      email: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
    };
    items?: {
      sku: string;
      product_name: string;
      price: number;
      quantity: number;
      width?: number;
      height?: number;
      length?: number;
      weight_lbs?: number;
      stackable?: boolean;
      hazardous?: boolean;
      freight_class?: string;
      subtotal?: number;
    }[];
    preferences?: {
      width?: string;
      height?: string;
      length?: string;
      volume?: number;
      weight?: string;
      max_width?: number;
      max_height?: number;
      max_length?: number;
      residential?: boolean;
      confirmation?: string;
      package_type?: string;
      service_class?: string;
    };
    summary?: any;
    notes?: string;
    status?: 'draft' | 'quoted' | 'confirmed' | 'cancelled';
    quote_results?: {
      code: string;
      description: string;
      total: string;
      currency: string;
      deliveryDays?: string;
      deliveryTime?: string;
    }[];
    selected_service?: {
      code: string;
      name: string;
      cost: string;
      delivery_days?: string;
      delivery_time?: string;
    };
    created_at?: string;
    updated_at?: string;
  };