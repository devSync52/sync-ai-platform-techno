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
    ups: [
      { name: 'client_id', label: 'Client ID', type: 'text' },
      { name: 'client_secret', label: 'Client Secret', type: 'text' },
      { name: 'extensiv_id', label: 'User login e-mail', type: 'text' },
    ],
    fedex: [
      { name: 'client_id', label: 'Client ID', type: 'text' },
      { name: 'client_secret', label: 'Client Secret', type: 'text' },
      { name: 'extensiv_id', label: 'User login e-mail', type: 'text' },
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