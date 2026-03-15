# 🔨 Build Guide - Shared Pomodoro Desktop

Guia completo para fazer build do app desktop.

## 🎯 Ambientes

### Development Build
- Conecta em: `http://localhost:3000`
- Requer: Servidor local rodando (`npm run dev`)
- Uso: Testes locais

### Production Build
- Conecta em: `https://shared-focus.vercel.app`
- Não requer: Servidor local
- Uso: Distribuição final

---

## 📦 Build de Produção (Recomendado)

### Passo 1: Instalar Dependências

```bash
cd /Users/edgarberlinck/code/Shared-Pomodoro
npm install
```

### Passo 2: Compilar e Build

```bash
npm run electron:build:mac
```

Este comando:
1. Define `NODE_ENV=production`
2. Compila TypeScript (`tsc -p tsconfig.desktop.json`)
3. Executa Electron Builder
4. Gera DMG e ZIP em `release/`

### Passo 3: Testar o Build

```bash
# Abra o DMG
open release/Shared\ Pomodoro-*.dmg

# Ou extraia o ZIP
unzip release/Shared\ Pomodoro-*-mac.zip -d /Applications/
```

### Passo 4: Distribuir

O DMG pode ser distribuído para outros usuários:
- Eles **NÃO precisam** ter o servidor rodando localmente
- App conecta diretamente em `https://shared-focus.vercel.app`
- Funciona em qualquer Mac (sem dependências)

---

## 🧪 Build de Desenvolvimento

Para testar com servidor local:

```bash
npm run electron:build:mac:dev
```

Este build:
- Conecta em `http://localhost:3000`
- Requer servidor local rodando
- Útil para debugging

---

## 🔧 Build Customizado

### Com Servidor Diferente

```bash
# Define a URL do servidor
API_URL=https://seu-servidor.com npm run electron:build:mac
```

### Com .env File

Crie `desktop/.env`:
```env
API_URL=https://seu-servidor.com
NODE_ENV=production
```

Depois:
```bash
npm run electron:build:mac
```

---

## 📁 Arquivos Gerados

Após o build, em `release/`:

```
release/
├── Shared Pomodoro-0.1.0.dmg          # Instalador DMG
├── Shared Pomodoro-0.1.0-mac.zip      # App zipado
├── Shared Pomodoro-0.1.0-arm64.dmg    # DMG para Apple Silicon
└── mac/
    └── Shared Pomodoro.app            # App final
```

### Tamanho dos Arquivos

- **DMG**: ~150MB (comprimido)
- **ZIP**: ~200MB (descomprimido)
- **.app**: ~250MB (instalado)

---

## 🎨 Customizar o Build

### Mudar Nome do App

Em `package.json`:
```json
{
  "name": "shared-pomodoro",
  "productName": "Shared Pomodoro",  // ← Mude aqui
  "version": "0.1.0"
}
```

### Mudar Versão

Em `package.json`:
```json
{
  "version": "0.1.0"  // ← Mude aqui
}
```

### Adicionar Ícones

Adicione `desktop/assets/icon.icns` e em `package.json`:
```json
{
  "build": {
    "mac": {
      "icon": "desktop/assets/icon.icns"
    }
  }
}
```

### Code Signing (Opcional)

Para distribuição pública:

```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Seu Nome (TEAM_ID)",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist"
    }
  }
}
```

---

## ✅ Checklist de Build

Antes de distribuir:

- [ ] Versão atualizada em `package.json`
- [ ] Testado localmente (`npm run electron:dev`)
- [ ] Build de produção compilou sem erros
- [ ] DMG abre corretamente
- [ ] App conecta em `https://shared-focus.vercel.app`
- [ ] Login funciona
- [ ] Timer sincroniza corretamente
- [ ] Notificações aparecem
- [ ] Ícones aparecem (se customizados)

---

## 🐛 Troubleshooting

### Build Falha

**Problema**: `electron-builder` não encontrado

**Solução**:
```bash
npm install --save-dev electron-builder
npm run electron:build:mac
```

### DMG Não Abre

**Problema**: "App is damaged and can't be opened"

**Solução** (usuário final):
```bash
xattr -cr /Applications/Shared\ Pomodoro.app
```

### App Não Conecta

**Problema**: Não consegue fazer login

**Solução**:
1. Verifique se `https://shared-focus.vercel.app` está online
2. Teste no browser primeiro
3. Verifique logs: `~/Library/Logs/Shared Pomodoro/`

### Build Muito Grande

**Problema**: DMG > 200MB

**Solução**: Normal! Electron empacota Chromium + Node.js

Para reduzir:
```json
{
  "build": {
    "asar": true,
    "compression": "maximum"
  }
}
```

---

## 🚀 Distribuição

### Via GitHub Releases

1. Crie uma release no GitHub
2. Faça upload do DMG
3. Usuários baixam e instalam

### Via Website

```html
<a href="https://github.com/seu-repo/releases/download/v0.1.0/Shared-Pomodoro-0.1.0.dmg">
  Download para Mac
</a>
```

### Auto-Update (Futuro)

Configure `electron-updater`:
```bash
npm install electron-updater
```

---

## 📊 Build Stats

### Tempo de Build
- **Dev**: ~30 segundos
- **Prod**: ~2 minutos

### Requisitos de Sistema
- **macOS**: 10.13+ (High Sierra)
- **RAM**: 4GB+
- **Disk**: 500MB

---

## 💡 Dicas

1. **Sempre teste o build** antes de distribuir
2. **Use versionamento semântico** (0.1.0 → 0.2.0)
3. **Mantenha changelog** do que mudou
4. **Teste em diferentes macOS versions** se possível
5. **Consider code signing** para distribuição pública

---

## 🎉 Pronto!

Seu build está pronto para ser distribuído! 

```bash
# Build final
npm run electron:build:mac

# Encontre em:
ls release/

# Distribua o DMG! 🚀
```
