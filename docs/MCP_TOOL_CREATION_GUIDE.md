# MCPツール作成・公開ガイド

このガイドでは、Jarvis AppiumプロジェクトでMCP（Model Context Protocol）ツールを新規作成し、クライアント側で利用可能にするための完全な手順を説明します。

## 📋 目次

1. [MCPツールの基本構造](#mcp-ツールの基本構造)
2. [新しいツールの作成手順](#新しいツールの作成手順)
3. [ツールの登録・公開手順](#ツールの登録公開手順)
4. [実際の例：appium_press_enter](#実際の例appium_press_enter)
5. [トラブルシューティング](#トラブルシューティング)
6. [ベストプラクティス](#ベストプラクティス)

## 🏗️ MCPツールの基本構造

MCPツールは以下の要素で構成されます：

### 基本的なツール定義

```typescript
import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';

export default function yourToolName(server: FastMCP): void {
  // パラメータスキーマ（引数がある場合）
  const yourSchema = z.object({
    paramName: z.string().describe('パラメータの説明'),
  });

  server.addTool({
    name: 'tool_name',                    // ツール名（クライアント側で表示）
    description: 'ツールの説明',          // ツールの機能説明
    parameters: yourSchema,               // パラメータスキーマ（オプション）
    annotations: {
      readOnlyHint: false,               // 読み取り専用かどうか
      openWorldHint: false,              // オープンワールドヒント
    },
    execute: async (args: any, context: any): Promise<any> => {
      // ツールの実行ロジック
      try {
        // 実際の処理
        return {
          content: [
            {
              type: 'text',
              text: '成功メッセージ',
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `エラー: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
```

### 引数なしツールの場合

```typescript
export default function noArgsToolName(server: FastMCP): void {
  server.addTool({
    name: 'tool_name',
    description: 'ツールの説明',
    // parametersプロパティは省略
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      // 処理ロジック
    },
  });
}
```

## 🆕 新しいツールの作成手順

### ステップ 1: ツールファイルの作成

適切なディレクトリにツールファイルを作成します：

```bash
# インタラクション系ツールの場合
touch src/tools/interactions/yourTool.ts

# セッション管理系ツールの場合
touch src/tools/yourTool.ts
```

### ステップ 2: ツールの実装

```typescript
// src/tools/interactions/yourTool.ts
import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { z } from 'zod';
import { getDriver } from '../sessionStore.js';

export default function yourTool(server: FastMCP): void {
  const yourToolSchema = z.object({
    // 必要なパラメータを定義
  });

  server.addTool({
    name: 'appium_your_tool',
    description: 'Your tool description',
    parameters: yourToolSchema, // 引数がない場合は省略
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      const driver = getDriver();
      if (!driver) {
        throw new Error('No driver found');
      }

      try {
        // ツールの実行ロジック
        // const result = await driver.someAction();
        
        return {
          content: [
            {
              type: 'text',
              text: '成功メッセージ',
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to execute. err: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
```

### ステップ 3: 型チェック・エラー確認

```bash
# TypeScriptコンパイル確認
npm run build

# リンター確認
npm run lint
```

## 📢 ツールの登録・公開手順

### ステップ 1: tools/index.ts にインポート追加

```typescript
// src/tools/index.ts
import yourTool from './interactions/yourTool.js'; // 適切なパスに変更

export default function registerTools(server: FastMCP): void {
  // 既存のツール登録...
  
  // 新しいツールを追加
  yourTool(server);
  
  console.log('All tools registered');
}
```

### ステップ 2: READMEドキュメント更新

```markdown
<!-- README.md の適切な箇所に追加 -->
#### `appium_your_tool`

Your tool description here.

- **Parameters**:
  - `paramName`: Parameter description
```

### ステップ 3: サーバー再起動

```bash
# 開発環境での確認
npm run dev

# または本番ビルド
npm run build
npm start
```

### ステップ 4: クライアント側での確認

1. MCPクライアントを再起動
2. ツールリストに新しいツールが表示されることを確認
3. ツールの実行テスト

## 🔧 実際の例：appium_press_enter

### ファイル構造
```
src/tools/interactions/pressEnter.ts
```

### 実装コード
```typescript
import { FastMCP } from 'fastmcp/dist/FastMCP.js';
import { getDriver } from '../sessionStore.js';

export default function pressEnter(server: FastMCP): void {
  server.addTool({
    name: 'appium_press_enter',
    description: 'Press Enter key on the device',
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (_args: any, _context: any): Promise<any> => {
      const driver = getDriver();
      if (!driver) {
        throw new Error('No driver found');
      }
      
      try {
        // プラットフォーム別のキー送信処理
        const capabilities = await driver.sessionCapabilities;
        const platform = capabilities?.platformName?.toLowerCase();
        
        if (platform === 'android') {
          await driver.pressKeyCode(66); // KEYCODE_ENTER
        } else if (platform === 'ios') {
          await driver.sendKeys('\n');
        } else {
          // W3C Actions API（汎用）
          await driver.performActions([
            {
              type: 'key',
              id: 'keyboard',
              actions: [
                { type: 'keyDown', value: '\uE007' },
                { type: 'keyUp', value: '\uE007' },
              ],
            },
          ]);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: 'Successfully pressed Enter key.',
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to press Enter key. err: ${err.toString()}`,
            },
          ],
        };
      }
    },
  });
}
```

### 登録コード
```typescript
// src/tools/index.ts
import pressEnter from './interactions/pressEnter.js';

export default function registerTools(server: FastMCP): void {
  // 他のツール...
  pressEnter(server);
  console.log('All tools registered');
}
```

## 🚨 トラブルシューティング

### 問題: ツールがクライアント側で表示されない

**確認ポイント:**

1. **index.tsでの登録確認**
   ```typescript
   // src/tools/index.ts にインポートと関数呼び出しがあるか
   import yourTool from './path/to/yourTool.js';
   // registerTools関数内で呼び出されているか
   yourTool(server);
   ```

2. **パラメータスキーマの問題**
   ```typescript
   // 引数なしの場合は parameters プロパティを省略
   server.addTool({
     name: 'tool_name',
     description: 'description',
     // parameters: schema, ← 引数なしなら削除
     annotations: { ... },
     execute: async () => { ... }
   });
   ```

3. **サーバー再起動**
   ```bash
   # 完全に停止してから再起動
   npm run build
   npm start
   ```

4. **クライアントのキャッシュクリア**
   - MCPクライアントの再起動
   - ツールリストの再取得

### 問題: TypeScriptコンパイルエラー

**確認ポイント:**

1. **インポートパスの確認**
   ```typescript
   // 正しい拡張子(.js)を使用
   import { getDriver } from '../sessionStore.js';
   ```

2. **型定義の確認**
   ```typescript
   // 適切な型を使用
   execute: async (args: any, context: any): Promise<any> => {
   ```

### 問題: 実行時エラー

**確認ポイント:**

1. **ドライバーの存在確認**
   ```typescript
   const driver = getDriver();
   if (!driver) {
     throw new Error('No driver found');
   }
   ```

2. **エラーハンドリング**
   ```typescript
   try {
     // 処理
   } catch (err: any) {
     return {
       content: [{
         type: 'text',
         text: `Error: ${err.toString()}`,
       }],
     };
   }
   ```

## ✅ ベストプラクティス

### 命名規則

- **ツール名**: `appium_` プレフィックスを使用（例：`appium_press_enter`）
- **ファイル名**: camelCase（例：`pressEnter.ts`）
- **関数名**: camelCase（例：`pressEnter`）

### エラーハンドリング

```typescript
try {
  // メイン処理
  const result = await someOperation();
  return {
    content: [{
      type: 'text',
      text: `Success: ${result}`,
    }],
  };
} catch (err: any) {
  return {
    content: [{
      type: 'text',
      text: `Failed: ${err.toString()}`,
    }],
  };
}
```

### パラメータ検証

```typescript
const schema = z.object({
  elementUUID: z.string().describe('Element identifier'),
  text: z.string().min(1).describe('Text to enter'),
});
```

### ドキュメント

- READMEの更新
- TypeScriptのコメント
- 使用例の提供

### テスト

```typescript
// テストファイルの作成を推奨
// src/tests/yourTool.test.ts
```

## 📁 ファイル構造まとめ

```
src/
├── tools/
│   ├── index.ts                    # ツール登録のメインファイル
│   ├── interactions/
│   │   ├── yourTool.ts            # 新しいツール実装
│   │   ├── pressEnter.ts          # 例: Enterキーツール
│   │   └── ...
│   └── ...
├── server.ts                      # MCPサーバー設定
├── index.ts                       # エントリーポイント
└── ...
README.md                          # ドキュメント更新
```

この手順に従って新しいMCPツールを作成・公開することで、クライアント側から利用可能なツールを確実に追加できます。