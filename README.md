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

## CI設定

参考: [CircleCiとFireBaseを連携させるのに4時間かかった](https://qiita.com/hp_kj/items/bcf553715b1e441c216f)

### CircleCI CLIを使うべし(CircleCI 2.0から)

動作検証するのにいちいちGitHubでプッシュとかやってられないので、
`circleci`(CircleCI CLI)を使うべし(CircleCI 2.0から)。

```sh
curl -fLSs https://circle.ci/cli | bash

circleci config validate -c .circleci/config.yml
```

ローカルでビルドする

**注意点**

* 環境変数を指定するときは `-e` オプションを使うこと
  `circleci build .circleci/config.yml -e VAR=VAL` みたいに書く必要がある
* circleci CLIは Workflowsに対応していない
* `restore_cache`, `save_cache` が使えない

```sh
circleci build
```
