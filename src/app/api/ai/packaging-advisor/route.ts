import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { items } = await req.json()

    const messages = [
      {
        role: 'system',
        content:
          'Você é um especialista em logística e empacotamento. Sua função é sugerir como agrupar os produtos informados da forma mais eficiente possível para transporte.',
      },
      {
        role: 'user',
        content: `Sugira pacotes otimizados para os seguintes itens:\n\n${JSON.stringify(items, null, 2)}\n\nRetorne um array JSON no formato: [{ sku, quantity, package_type, length, width, height, weight }]`,
      },
    ]

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
      }),
    })

    const data = await openAiResponse.json()

    const responseText = data.choices?.[0]?.message?.content || ''
    console.log('🧠 Raw AI Response:', responseText)

    // tentar extrair JSON do texto
    const jsonStart = responseText.indexOf('[')
    const jsonEnd = responseText.lastIndexOf(']')
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON object found in AI response')
    }

    const jsonString = responseText.slice(jsonStart, jsonEnd + 1)
    const suggestedPackages = JSON.parse(jsonString)
    // Calcular volume total e peso total
    let totalWeight = 0;
    let totalVolume = 0;

    for (const pkg of suggestedPackages) {
      const itemVolume = (pkg.length || 0) * (pkg.width || 0) * (pkg.height || 0) * pkg.quantity;
      totalVolume += itemVolume;
      totalWeight += (pkg.weight || 0);
    }

    // Estimar caixa cúbica com base no volume total
    const cubeSide = Math.cbrt(totalVolume);

    // Criar pacote combinado realista
    const combinedPackage = {
      sku: 'mixed',
      quantity: suggestedPackages.reduce((sum: number, pkg: any) => sum + pkg.quantity, 0),
      package_type: 'Box',
      length: parseFloat(cubeSide.toFixed(2)),
      width: parseFloat(cubeSide.toFixed(2)),
      height: parseFloat(cubeSide.toFixed(2)),
      weight: parseFloat(totalWeight.toFixed(2)),
    };

    return NextResponse.json({ suggestedPackages: [combinedPackage] })
  } catch (error: any) {
    console.error('❌ Packaging Advisor Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}