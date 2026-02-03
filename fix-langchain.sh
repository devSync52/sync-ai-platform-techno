#!/bin/bash

echo "🚧 Limpando projeto para uso do LangChain modular..."

# Remover dependência monolítica antiga
echo "🔍 Removendo 'langchain' (monolítica, obsoleta)..."
npm uninstall langchain

# Remover node_modules e lockfile
echo "🧹 Limpando node_modules e package-lock.json..."
rm -rf node_modules
rm -f package-lock.json

# Reinstalar tudo
echo "📦 Instalando dependências..."
npm install

# Checagem
echo "✅ Verificação final..."
npm list langchain || echo "✔️ 'langchain' (antigo) removido com sucesso!"

echo "🎉 Pronto! Agora você está usando a versão modular do LangChain."