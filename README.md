# Frontend デモ - チャットサーバ

## 参考

書籍"React，Angular，Vue.js，React Native を使って学ぶ はじめてのフロントエンド開発"

## アーキテクチャ

- Language: Node.js
- FW: Express
- BaaS: Firebase
- CI: CircleCI

## CLI(Firebase)

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

## CI 設定

参考: [CircleCi と FireBase を連携させるのに 4 時間かかった](https://qiita.com/hp_kj/items/bcf553715b1e441c216f)

### CircleCI CLI を使うべし(CircleCI 2.0 から)

動作検証するのにいちいち GitHub でプッシュとかやってられないので、
`circleci`(CircleCI CLI)を使うべし(CircleCI 2.0 から)。

```sh
curl -fLSs https://circle.ci/cli | bash

circleci config validate -c .circleci/config.yml
```

ローカルでビルドする
**注意点**

- 環境変数を指定するときは `-e` オプションを使うこと
  `circleci build .circleci/config.yml -e VAR=VAL` みたいに書く必要がある
- circleci CLI は Workflows に対応していない
- `restore_cache`, `save_cache` が使えない

```sh
circleci build
```
