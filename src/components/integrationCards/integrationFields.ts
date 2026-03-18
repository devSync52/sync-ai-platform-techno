export const integrationFields = {
  sellercloud: [
    { name: 'domain', label: 'Domain (URL)', type: 'text' },
    { name: 'username', label: 'Username', type: 'text' },
    { name: 'password', label: 'Password', type: 'password' },
    ],
    extensiv: [
      { name: 'client_id', label: 'Client ID', type: 'text' },
      { name: 'client_secret', label: 'Client Secret', type: 'text' },
      { name: 'extensiv_id', label: 'User login e-mail', type: 'text' },
    ],
    magaya: [
      { name: 'api_url', label: 'API URL', type: 'text' },
      { name: 'username', label: 'Username', type: 'text' },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'company_id', label: 'Company ID', type: 'text' },
    ],
    ups: [
      { name: 'account_number', label: 'Account Number', type: 'text' },
      { name: 'client_id', label: 'Client ID', type: 'text' },
      { name: 'client_secret', label: 'Client Secret', type: 'password' },
    ],
    fedex: [
      { name: 'account_number', label: 'Account Number', type: 'text' },
      { name: 'client_id', label: 'API Key (Client ID)', type: 'text' },
      { name: 'client_secret', label: 'API Secret (Client Secret)', type: 'password' },
      { name: 'scope', label: 'Scope (optional, e.g., CXS)', type: 'text' },
    ],
    quickbooks: [
      { name: 'client_id', label: 'Client ID', type: 'text' },
      { name: 'client_secret', label: 'Client Secret', type: 'text' },
      { name: 'extensiv_id', label: 'User login e-mail', type: 'text' },
    ],
    project44: [
      { name: 'token', label: 'API Token', type: 'text' }
    ]
  }
  
  export type IntegrationType = keyof typeof integrationFields
