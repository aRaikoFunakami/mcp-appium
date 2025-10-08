# ローカル開発環境のセットアップ手順

このドキュメントは、リポジトリのソースコードをローカル環境で正しくビルドし、実行するための手順をまとめたものです。

---

### ステップ1：ソースコードの取得

```bash
git clone https://github.com/aRaikoFunakami/mcp-appium.git
cd mcp-appium
```
- **意味**: GitHubからプロジェクトのソースコード一式を、お使いのPCにダウンロード（クローン）し、プロジェクトディレクトリに移動します。

---

### ステップ2：ブランチの切り替え

```bash
git checkout testroid
```
- **意味**: `testroid`ブランチに切り替えます。このブランチで作業を行う必要があります。

---

### ステップ3：Appium実行環境の整備

```bash
# 1. Appiumをインストール
npm install -g appium

# 2. ドライバーをインストール
appium driver install uiautomator2
```

---

### ステップ4：プロジェクト依存関係のインストール

```bash
npm install
```
- **意味**: `package.json`ファイルに記載されている、このプロジェクトが動作するために必要なライブラリ（`FastMCP`, `typescript`など）を、すべて`node_modules`というフォルダにダウンロード・インストールします。


---

### ステップ5：プロジェクトのビルド

```bash
npm run build
```
- **意味**: `package.json`の`scripts`に定義されたビルドコマンドを実行します。これにより、ステップ5で修正されたものを含むTypeScript（`.ts`）のソースコードが、Node.jsで実行可能なJavaScript（`.js`）のコードにコンパイル（変換）され、`dist`というフォルダに保存されます。**この手順を踏まないと、コードの修正が実行ファイルに反映されません。**

---

### ステップ6：ローカルサーバーの起動

```bash
node dist/index.js --sse --port=7777
npm run start:sse -- --port=7777
```
- **意味**: ビルドによって生成された、修正済みのJavaScriptプログラムを実行し、ローカルサーバーを起動します。テストを実行する際は、このローカルサーバーを参照するように設定してください。

---

## 補足
- `main`ブランチではなく、必ず`testroid`ブランチで作業してください。
- 以降は通常のMCPサーバー利用手順に従ってください。
