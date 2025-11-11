// test/integration.test.ts
import { supabase } from '@/lib/supa'

async function testConnection() {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('❌ Erro de conexão:', error)
    return false
  }
  
  console.log('✅ Conexão OK')
  return true
}

async function testServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
  
  if (error || !data || data.length !== 26) {
    console.error('❌ Erro nos serviços')
    return false
  }
  
  console.log('✅ Serviços OK (26 cadastrados)')
  return true
}

// Executar testes
testConnection()
testServices()