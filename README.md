# Expo PWA + Firebase CRUD

Projeto Expo SDK 54 com React Native Web e duas telas: formulário (Nome e Descrição) e listagem com Editar/Excluir.

## Situação

- Código do CRUD com Firestore implementado, ainda não testado em execução.
- Manifesto e Service Worker adicionados, ainda não validados em build/deploy.
- Sem configuração de Firebase: o app exibe aviso e bloqueia o salvamento.
- As regras em `firestore.rules` negam todo acesso por segurança. Não abra o banco indiscriminadamente em produção.

## Rodar

```bash
npm install
npx expo start --web
```

Para build:

```bash
npm run build:web
```

Sirva a pasta `dist` em HTTPS ou localhost e verifique em DevTools > Application: Manifest e Service Workers. O arquivo `public/sw.js` mantém apenas um cache básico de shell e **não** implementa persistência offline do Firestore. Ícone SVG está incluído, mas navegadores podem exigir PNG de 192x192 e 512x512 para instalação; gerar e validar esses ícones antes de considerar o PWA concluído.

## Firebase

1. Crie um projeto no Firebase Console e adicione um app Web.
2. Habilite Cloud Firestore e defina uma política de acesso apropriada.
3. Copie `.env.example` para `.env` e preencha `EXPO_PUBLIC_FIREBASE_*` com os valores da configuração Web.
4. Reinicie o Expo. Os dados são gravados na coleção `registros`.
5. Para teste com escrita real, implemente autenticação e regras que limitem o acesso aos usuários autorizados. As regras fornecidas inicialmente negam leituras e escritas.

A configuração Web do Firebase não é segredo, mas nunca exponha contas de serviço ou credenciais administrativas. Não publique o `.env`.

## Checkpoints

1. Estrutura Expo: enviada ao GitHub; execução pendente.
2. PWA: scaffold enviado; instalação pendente de validação.
3. Telas: implementadas; execução pendente.
4. Firebase: SDK preparado; configuração e regras de acesso pendentes.
5. Create/Read: código implementado; testes pendentes.
6. Update/Delete: código implementado; testes pendentes.
7. Testes finais: pendentes.

Não considere a implementação aprovada até verificar `npm install`, `npm run build:web`, deploy HTTPS, instalação PWA e operações no Firestore.
