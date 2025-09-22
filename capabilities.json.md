# `capabilities.json`の調査結果

`capabilities.json`ファイルは、Appiumセッションを開始する際の設定（Capabilities）を外部から提供するために使用されます。

## `create_session`ツールによる読み込み

プロジェクト内の`src/tools/create-session.ts`で定義されている`create_session`ツールが、セッション作成時にこの設定ファイルを読み込みます。

ファイルのパスは、環境変数 `CAPABILITIES_CONFIG` を通じてツールに渡されます。`create_session`ツールは、この環境変数が指すパスにファイルが存在するかどうかを確認し、存在すればその内容を読み込んでJSONとして解析します。

```typescript
// src/tools/create-session.ts 内の該当コード
let configCapabilities: CapabilitiesConfig = { android: {}, ios: {} };
const configPath = process.env.CAPABILITIES_CONFIG;

if (configPath && fs.existsSync(configPath)) {
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    configCapabilities = JSON.parse(configContent);
  } catch (error) {
    console.warn(`Failed to parse capabilities config: ${error}`);
  }
}
```

## 内容と目的

`capabilities.json`は、プラットフォーム（`android`または`ios`）をキーとするJSONオブジェクトを内包します。それぞれのキーの下に、そのプラットフォームで使用したいAppiumのCapabilityを定義します。

**例:**
```json
{
  "android": {
    "appium:app": "/path/to/your/app.apk"
  },
  "ios": {
    "appium:deviceName": "iPhone 15 Pro",
    "appium:platformVersion": "17.0"
  }
}
```

`create_session`ツールは、実行時に指定されたプラットフォーム（例：`android`）に対応する設定をこのファイルから取得し、デフォルトのCapabilitiesや実行時に引数として渡されたカスタムCapabilitiesとマージします。

これにより、コードを直接変更することなく、対象のアプリやデバイスといった環境固有の情報を柔軟に切り替えることが可能になります。

## AndroidのCapability詳細

`create_session`ツールはAndroid向けに以下の3つのCapabilityをデフォルトで設定します。
- `platformName`: 'Android'
- `appium:automationName`: 'UiAutomator2'
- `appium:deviceName`: 'Android Device'

これら以外の項目を`capabilities.json`の`android`オブジェクト内に設定します。

### 必須項目 (Required)
これらはセッションを開始するために`capabilities.json`で必ず指定する必要があります。

| Capability | 説明 | 例 |
| :--- | :--- | :--- |
| `appium:platformVersion` | ターゲットデバイスのAndroid OSバージョン。 | `"14.0"` |
| `appium:app` | テスト対象アプリ（`.apk`または`.aab`ファイル）の絶対パスまたはURL。 | `"/Users/user/apps/android-app.apk"` |

### 推奨項目 (Recommended)
これらは必須ではありませんが、テストの安定性や特定のアプリ・デバイスを正確に指定するために設定することが強く推奨されます。

| Capability | 説明 | 例 |
| :--- | :--- | :--- |
| `appium:appPackage` | 起動するアプリのJavaパッケージ名。`app` Capabilityと同時に指定すると、アプリの起動が高速化されることがあります。 | `"com.google.android.gm"` |
| `appium:appActivity` | 起動するアプリのメインアクティビティ名。 | `".GmailActivity"` |
| `appium:udid` | 複数のデバイスが接続されている場合に、テストを実行するデバイスを一意に特定するためのID。 | `"emulator-5554"` |

### オプション項目 (Optional)
これらはテストセッションの挙動をカスタマイズするために使用します。

| Capability | 説明 | デフォルト値 | 例 |
| :--- | :--- | :--- | :--- |
| `appium:deviceName` | デバイス名。エミュレーターや実機を区別するために使用します。 | `"Android Device"` | `"Pixel_8_Pro"` |
| `appium:noReset` | `true`に設定すると、セッション間でアプリのデータを保持します（リセットしません）。 | `false` | `true` |
| `appium:fullReset` | `true`に設定すると、セッション開始前にアプリを完全にアンインストールし、再インストールします。 | `false` | `true` |
| `appium:autoGrantPermissions` | `true`に設定すると、アプリのインストール時に全てのパーミッションを自動的に許可します。 | `false` | `true` |
| `appium:avd` | 起動するAndroid Virtual Device（AVD）の名前。 | (なし) | `"Pixel_8_API_34"` |
| `appium:isHeadless` | `true`に設定すると、エミュレーターをヘッドレスモードで実行します。 | `false` | `true` |