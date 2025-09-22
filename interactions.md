# 1. ソフトウェアの目的と主要な機能

このモジュールは、Appiumが提供するドライバーの機能をラップし、モバイルアプリケーションのUIを操作するための一連の「ツール」を提供します。各ツールは、クリック、テキスト入力、要素検索などの基本的なユーザー操作を抽象化し、外部のシステム（AIエージェントなど）が簡単に呼び出せるように設計されています。これにより、自然言語の指示を具体的なUI操作に変換する処理を容易にします。

## 2. プロジェクト構造とアーキテクチャ

### ディレクトリ構造と主要な役割

`src/tools/interactions`ディレクトリ内の各ファイルは、単一のAppium操作に対応するツールを定義しています。

-   `find.ts`: 指定された戦略（XPath, IDなど）とセレクタを使ってUI要素を検索する。
-   `click.ts`: `find.ts`などで取得した要素をクリックする。
-   `setValue.ts`: 要素にテキストを入力する。
-   `getText.ts`: 要素からテキストを取得する。
-   `screenshot.ts`: 現在の画面のスクリーンショットを撮影する。
-   `activateApp.ts`: 指定したIDのアプリケーションを起動・フォアグラウンド化する。
-   `terminateApp.ts`: アプリケーションを終了する。

これらのツールはすべて、`sessionStore.js`を介して現在アクティブなAppiumドライバーインスタンスを取得し、操作を実行します。

### 主要な技術スタック

-   **言語**: TypeScript
-   **ライブラリ**:
    -   `fastmcp`: サーバーにツールとして登録するためのフレームワーク。
    -   `zod`: ツールの入力パラメータの型定義とバリデーションに使用。
    -   `webdriverio`: Appiumドライバーの操作に使用（`getDriver()`経由）。

### アーキテクチャ図

```mermaid
graph TD;
    subgraph External Caller
        A[AI Agent / User]
    end

    subgraph Server
        B(FastMCP Server)
    end

    subgraph "src/tools/interactions"
        C[appium_find_element]
        D[appium_click]
        E[appium_set_value]
        F[...other tools]
    end

    subgraph Session Management
        G(sessionStore.ts)
    end

    subgraph Appium
        H(Appium Driver)
    end

    A -- "'Click button X'" --> B;
    B -- "execute('appium_click', ...)" --> D;
    C --> G;
    D --> G;
    E --> G;
    F --> G;
    G -- "getDriver()" --> H;
    D -- "driver.click()" --> H;

```

## 3. 主要な機能と処理フロー

### 機能1: 要素の検索とクリック

ユーザーが「ログインボタンをクリックして」のような指示を出した場合、まず要素を検索し、次に見つかった要素をクリックするという一連の処理が実行されます。

```mermaid
sequenceDiagram
    participant Agent as "AI Agent"
    participant Server as "FastMCP Server"
    participant find as "appium_find_element"
    participant click as "appium_click"
    participant sessionStore
    participant AppiumDriver

    Agent->>Server: "'ログインボタン'を探して"
    Server->>find: execute({strategy: 'xpath', selector: '...'}) 
    activate find
    find->>sessionStore: getDriver()
    activate sessionStore
    sessionStore-->>find: driver instance
    deactivate sessionStore
    find->>AppiumDriver: driver.findElement('xpath', '...')
    activate AppiumDriver
    AppiumDriver-->>find: elementUUID
    deactivate AppiumDriver
    find-->>Server: {..., text: "Found element ... Element id a-b-c"}
    deactivate find
    Server-->>Agent: 「要素 a-b-c が見つかりました」

    Agent->>Server: "要素 a-b-c をクリックして"
    Server->>click: execute({elementUUID: 'a-b-c'})
    activate click
    click->>sessionStore: getDriver()
    activate sessionStore
    sessionStore-->>click: driver instance
    deactivate sessionStore
    click->>AppiumDriver: driver.click('a-b-c')
    activate AppiumDriver
    AppiumDriver-->>click: success
    deactivate AppiumDriver
    click-->>Server: {..., text: "Successfully clicked..."}
    deactivate click
    Server-->>Agent: 「クリックしました」
```

### findElement の詳細

`appium_find_element` ツールは、後続のインタラクション（クリック、テキスト入力など）の起点となる最も重要なツールの一つです。このツールの目的は、画面上の特定のUI要素を、指定された方法（戦略）で見つけ出し、その要素を一意に識別するためのID（`elementUUID`）を取得することです。

#### パラメータ

このツールは2つのパラメータを取ります。

1.  `strategy`: 要素を検索するための戦略です。以下の中から選択します。
    *   `xpath`: XMLのパス言語。柔軟で強力な指定が可能。
    *   `id`: `resource-id` (Android) や `name` (iOS) などの一意なID。
    *   `name`: 要素の `name` 属性。
    *   `class name`: `XCUIElementTypeButton` (iOS) や `android.widget.Button` (Android) といったクラス名。
    *   `accessibility id`: `content-desc` (Android) や `accessibility-id` (iOS) として設定されたアクセシビリティID。
    *   `css selector`: (WebView内でのみ有効)
    *   `-android uiautomator`: Android固有のUIAutomator APIを利用した検索。
    *   `-ios predicate string`: iOS固有の述語（Predicate）ベースのクエリ。
    *   `-ios class chain`: iOS固有のクラスチェーンによるクエリ。

2.  `selector`: 上記で選択した `strategy` に対応する具体的な値（例：`strategy`が`id`なら、セレクタは`'login_button'`）。

#### 返り値

検索に成功すると、ツールは `element.ELEMENT` プロパティ（内部的には `elementUUID` と呼ばれる）を返します。これは、Appiumセッション内でその要素を指し示す一意の参照IDです。`appium_click` や `appium_set_value` などの他のツールは、この `elementUUID` をパラメータとして受け取ることで、どの要素に対して操作を実行すべきかを正確に判断します。

### 機能2: テキスト入力

「ユーザー名に 'testuser' と入力して」といった指示に対応します。

```mermaid
sequenceDiagram
    participant Agent as "AI Agent"
    participant Server as "FastMCP Server"
    participant setValue as "appium_set_value"
    participant sessionStore
    participant AppiumDriver

    Agent->>Server: "要素 a-b-c に 'testuser' と入力して"
    Server->>setValue: execute({elementUUID: 'a-b-c', text: 'testuser'})
    activate setValue
    setValue->>sessionStore: getDriver()
    activate sessionStore
    sessionStore-->>setValue: driver instance
    deactivate sessionStore
    setValue->>AppiumDriver: driver.setValue('testuser', 'a-b-c')
    activate AppiumDriver
    AppiumDriver-->>setValue: success
    deactivate AppiumDriver
    setValue-->>Server: {..., text: "Successfully set value..."}
    deactivate setValue
    Server-->>Agent: 「入力しました」
```

### 機能3: スクリーンショット取得

現在の画面の状態を確認するために、スクリーンショットを取得します。

```mermaid
sequenceDiagram
    participant Agent as "AI Agent"
    participant Server as "FastMCP Server"
    participant screenshot as "appium_screenshot"
    participant sessionStore
    participant AppiumDriver

    Agent->>Server: "スクリーンショットを撮って"
    Server->>screenshot: execute()
    activate screenshot
    screenshot->>sessionStore: getDriver()
    activate sessionStore
    sessionStore-->>screenshot: driver instance
    deactivate sessionStore
    screenshot->>AppiumDriver: driver.getScreenshot()
    activate AppiumDriver
    AppiumDriver-->>screenshot: base64 image data
    deactivate AppiumDriver
    screenshot-->>Server: {..., text: "<base64_string>"}
    deactivate screenshot
    Server-->>Agent: base64エンコードされた画像データ
```
