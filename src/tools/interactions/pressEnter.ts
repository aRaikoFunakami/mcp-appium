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
        // AndroidKey.ENTERをプラットフォーム別に処理
        const capabilities = await driver.sessionCapabilities;
        const platform = capabilities?.platformName?.toLowerCase();
        
        if (platform === 'android') {
          // Android用のキーコード（KEYCODE_ENTER = 66）
          await driver.pressKeyCode(66);
        } else if (platform === 'ios') {
          // iOS用のキー送信
          await driver.sendKeys('\n');
        } else {
          // W3C Actions API（汎用）
          await driver.performActions([
            {
              type: 'key',
              id: 'keyboard',
              actions: [
                { type: 'keyDown', value: '\uE007' }, // Unicode for Enter
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
