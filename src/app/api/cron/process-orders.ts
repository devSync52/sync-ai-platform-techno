import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supa'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar autorização (usar secret token)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  try {
    // Lógica de processamento
    // Será implementada na Fase 2
    
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}