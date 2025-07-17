export type SupportTicket = {
    id: string;
    subject: string;
    description: string;
    status: 'open' | 'closed' | 'pending';
    priority: 'low' | 'medium' | 'high';
    category?: string;
    created_at: string;
    updated_at: string;
    account_id: string;
    client_id?: string;
  };
  
  export type SupportMessage = {
    id: string;
    ticket_id: string;
    sender_id: string;
    sender_role: 'user' | 'admin';
    message: string;
    created_at: string;
    internal_note?: boolean;
  };