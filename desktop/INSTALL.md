# 🚀 Guia Rápido - Instalação do Electron

O Electron pode ter problemas de instalação em alguns ambientes. Siga este guia:

## Método 1: Instalação Normal

```bash
cd /Users/edgarberlinck/code/Shared-Pomodoro
npm install
```

## Método 2: Se o Método 1 Falhar

```bash
# Limpe a instalação
rm -rf node_modules package-lock.json

# Reinstale tudo
npm install

# Verifique se electron foi instalado
npm ls electron
```

## Método 3: Instalação Manual do Electron

```bash
# Instale apenas o Electron
npm install --save-dev electron@34.5.8

# Ou com flag alternativa
npm install --save-dev --legacy-peer-deps electron@34.5.8

# Ou com yarn
yarn add -D electron@34.5.8
```

## Verificação

```bash
# Deve mostrar a versão instalada
npm ls electron

# Deve existir
ls node_modules/electron

# Teste a compilação
npx tsc -p tsconfig.desktop.json
```

## Problemas Comuns

### "Cannot find module 'electron'"

**Solução:**
```bash
npm install --save-dev electron electron-builder
```

### Erro de permissão no macOS

**Solução:**
```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

### Download do Electron falha

**Solução:**
```bash
# Use um mirror alternativo
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm install
```

## Teste Sem Compilar

Se quiser testar a lógica sem instalar Electron:

1. Os arquivos em `desktop/` estão prontos
2. A API HTTP já funciona (mesma do web app)
3. Você pode testar a API diretamente no browser

## Próximos Passos

Após instalação bem-sucedida:

```bash
# 1. Compile o TypeScript
npm run electron:dev

# Ou compile manualmente
npx tsc -p tsconfig.desktop.json

# 2. Rode o Electron
npx electron dist/desktop/main.js

# 3. Build para distribuição
npm run electron:build:mac
```

## Alternativa: Desenvolvimento sem Electron

Você pode desenvolver a UI no browser:

1. Abra `desktop/index.html` no browser
2. Adicione um mock da `window.electronAPI`
3. Teste a interface e lógica

O código está pronto para quando o Electron estiver instalado!
