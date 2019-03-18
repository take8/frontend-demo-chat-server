# Frontendデモ - チャットサーバ

## CLI

```sh
npm i -g firebase-tools
# ndenv rehash
```

```sh
firebase login
```

### Hosting の設定

```sh
firebase init hosting
# firebase use --add frontend-demo-chat
```

### Functions の設定

```sh
firebase init functions
```

参考: [Cloud Functions に TypeScript を使用する](https://firebase.google.com/docs/functions/typescript?hl=ja)

```sh
cd functions
npm run build
firebase serve --only functions
```

### Functions の公開

```sh
firebase deploy --only functions
```
