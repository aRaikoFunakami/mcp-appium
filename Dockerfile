# mcp-appium用Dockerfile
FROM node:20-slim

# 必要なシステムパッケージをインストール
RUN apt-get update && apt-get install -y \
    android-tools-adb \
    usbutils \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# ステップ1: すべてのソースコードをコピー
COPY . .

# ステップ3: Appium実行環境の整備
RUN npm install -g appium && \
    appium driver install uiautomator2

# ステップ4: プロジェクト依存関係のインストール
RUN npm install

# ステップ5: プロジェクトのビルド
RUN npm run build

# ADB設定
# ホストのadbサーバーに接続できるように環境変数を設定
ENV ADB_SERVER_SOCKET=tcp:host.docker.internal:5037

# mcp-appiumのポートを公開
EXPOSE 7777

# ステップ6: ローカルサーバーの起動
CMD ["node", "dist/index.js", "--sse", "--port=7777"]