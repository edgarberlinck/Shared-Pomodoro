# Shared Pomodoro - Desktop App (macOS) 🍅

Versão desktop do Shared Pomodoro para macOS que roda na menu bar.

## ⚠️ Pré-requisitos

Antes de começar, você precisa ter instalado:
- **Node.js 18+**
- **npm ou yarn**

## 📦 Instalação

1. **Clone o repositório (se ainda não fez):**
   ```bash
   git clone https://github.com/edgarberlinck/Shared-Pomodoro.git
   cd Shared-Pomodoro
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

   Isso vai instalar todas as dependências incluindo Electron e Electron Builder.

3. **Compile o código TypeScript:**
   ```bash
   npx tsc -p tsconfig.desktop.json
   ```

## ✨ Features

- 🎯 **Menu Bar App** – Fica na action bar do macOS, sempre acessível
- 🔄 **Sincronização HTTP** – Usa polling (5s) igual ao web app (compatível com Vercel Free)
- ⏱️ **Timer em Tempo Real** – Contagem regressiva suave no client com sync periódico
- 🔔 **Notificações Nativas** – Alertas do sistema quando muda de fase
- 🎨 **Interface Minimalista** – Janela pequena e focada
- 💾 **Persistência Local** – Salva login e sessão atual
- 🌐 **Controle pelo Menu** – Start/Pause/Reset direto da menu bar

## 🚀 Como Usar

### Desenvolvimento

1. **Certifique-se que o servidor está rodando:**
   ```bash
   npm run dev
   ```

2. **Em outro terminal, rode o app desktop:**
   ```bash
   npm run electron:dev
   ```

### Build para Distribuição

**Build de Produção** (aponta para https://shared-focus.vercel.app):
```bash
npm run electron:build:mac
```

**Build de Desenvolvimento** (aponta para http://localhost:3000):
```bash
npm run electron:build:mac:dev
```

Isso vai gerar:
- `release/Shared Pomodoro-{version}.dmg` - Instalador DMG
- `release/Shared Pomodoro-{version}-mac.zip` - App zipado

## 📦 Estrutura

```
desktop/
├── main.ts           # Processo principal do Electron
├── preload.ts        # Script de preload (bridge seguro)
├── renderer.ts       # Lógica da UI (roda no browser context)
├── index.html        # Interface do app
└── assets/
    ├── tray-icon.png # Ícone da menu bar (16x16 ou 32x32)
    └── icon.icns     # Ícone do app (para o .app e DMG)
```

## 🔧 Configuração

### Ícones

Você precisa adicionar dois ícones em `desktop/assets/`:

1. **tray-icon.png** - Ícone da menu bar (16x16 ou 32x32 pixels)
2. **icon.icns** - Ícone do aplicativo macOS

Para criar o `.icns`:
```bash
# Crie um ícone PNG 1024x1024
# Depois use:
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
mv icon.icns desktop/assets/
```

### Servidor da API

O app detecta automaticamente o ambiente:

- **Desenvolvimento** (`npm run electron:dev`): `http://localhost:3000`
- **Produção** (`npm run electron:build:mac`): `https://shared-focus.vercel.app`

Para override manual, use variável de ambiente:

```bash
API_URL=https://seu-servidor.com npm run electron:dev
```

Ou crie um arquivo `.env` em `desktop/`:
```env
API_URL=https://shared-focus.vercel.app
NODE_ENV=production
```

## 🎮 Como Funciona

### Autenticação

1. Login com email/password
2. Recebe JWT token da API
3. Salva localmente em `~/ Library/Application Support/shared-pomodoro/config.json`
4. Usa o token em todas as requisições

### Sincronização

- **Client-side countdown:** Timer roda localmente (suave, 1fps)
- **Server sync:** A cada 5 segundos, busca estado real do servidor
- **Actions:** Start/Pause/Reset fazem POST imediato

### Menu Bar

- **Clique:** Abre/fecha janela
- **Menu de contexto:**
  - Timer atual
  - Controles (Start/Pause/Reset)
  - Status de login
  - Abrir dashboard no browser
  - Quit

## 🔒 Segurança

- ✅ **contextIsolation** habilitado
- ✅ **nodeIntegration** desabilitado
- ✅ **Preload script** com whitelist de APIs
- ✅ Token armazenado localmente (não enviado pra terceiros)

## 🐛 Troubleshooting

### App não abre

Verifique se compilou o TypeScript:
```bash
tsc -p tsconfig.desktop.json
ls dist/desktop/
```

### Erro de conexão

Certifique-se que o servidor está rodando:
```bash
curl http://localhost:3000/api/sessions
```

### Ícone não aparece

Adicione `tray-icon.png` em `desktop/assets/`

## 📝 TODO

- [ ] Adicionar ícones oficiais
- [ ] Suporte a Windows/Linux
- [ ] Auto-updater
- [ ] Atalhos de teclado globais
- [ ] Sons de notificação customizados
- [ ] Modo escuro

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](../CONTRIBUTING.md) para detalhes.

## 📄 Licença

MIT - veja [LICENSE](../LICENSE)
