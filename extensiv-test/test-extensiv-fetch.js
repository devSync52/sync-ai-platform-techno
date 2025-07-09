require('dotenv').config()
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const EXTENSIV_BASE_URL = 'https://secure-wms.com'

const client_id = process.env.EXT_CLIENT_ID
const client_secret = process.env.EXT_CLIENT_SECRET
const extensiv_id = process.env.EXT_LOGIN

const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64')

const CUSTOMER_ID = 22 // ou qualquer outro ID válido

async function run() {
  try {
    console.log('🔐 Autenticando...')

    const tokenRes = await fetch(`${EXTENSIV_BASE_URL}/AuthServer/api/Token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        user_login: extensiv_id
      })
    })

    const tokenJson = await tokenRes.json()
    const token = tokenJson.access_token
    if (!token) throw new Error('❌ Sem access_token!')

    console.log('✅ Token obtido:', token.substring(0, 20) + '...')

    const url = `${EXTENSIV_BASE_URL}/customers/${CUSTOMER_ID}/items?pgsiz=100&pgnum=1&kitinclusion=Either`

    console.log('📦 Buscando produtos do cliente', CUSTOMER_ID)

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/hal+json',
        'Content-Type': 'application/hal+json; charset=utf-8'
      }
    })

    const data = await res.json()

    const embeddedItems =
      data._embedded?.['http://api.3plCentral.com/rels/customers/item'] || []

    console.log(`📦 Total de produtos recebidos: ${embeddedItems.length}`)

    const activeItems = embeddedItems.filter(
      (item) => item.readOnly?.deactivated === false
    )

    console.log(`✅ Total de produtos ATIVOS: ${activeItems.length}`)

    for (const item of activeItems.slice(0, 5)) {
      console.log(`➡️ SKU: ${item.sku} | itemId: ${item.itemId} | desc: ${item.description}`)
    }

  } catch (err) {
    console.error('❌ Erro:', err.message)
  }
}

run()