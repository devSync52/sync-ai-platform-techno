export const integrationFields = {
  sellercloud: [
    { name: 'domain', label: 'Domain (URL)', type: 'text' },
    { name: 'username', label: 'Username', type: 'text' },
    { name: 'password', label: 'Password', type: 'password' }
    ],
    extensiv: [
      { name: 'api_key', label: 'API Key', type: 'text' }
    ],
    project44: [
      { name: 'token', label: 'API Token', type: 'text' }
    ]
  }
  
  export type IntegrationType = keyof typeof integrationFields