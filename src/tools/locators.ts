/**
 * Tool to get page source from the Android session
 */
import { z } from 'zod';
import { getDriver } from './sessionStore.js';
import { generateAllElementLocators } from '../locators/generate-all-locators.js';

export default function generateLocators(server: any): void {
  server.addTool({
    name: 'generate_locators',
    description: `Generate locators for the current page.`,
    parameters: z.object({}),
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    execute: async (args: any, { log }: any): Promise<any> => {
      log.info('Getting page source');
      try {
        // Check for active driver session

        const driver = getDriver();
        if (!driver) {
          throw new Error(
            'No active driver session. Please create a session first.'
          );
        }

        console.log('Getting page source');

        try {
          // Get the page source from the driver
          const startPageSource = Date.now();
          const pageSource = await driver.getPageSource();
          const pageSourceTime = Date.now() - startPageSource;
          console.log(`⏱️  driver.getPageSource() took ${pageSourceTime}ms`);

          const driverName = (await driver.caps.automationName).toLowerCase();
          if (!pageSource) {
            throw new Error('Page source is empty or null');
          }
          const sampleXML = pageSource;

          const startAllElements = Date.now();
          const allElements = generateAllElementLocators(
            sampleXML,
            true,
            driverName
          );
          const allElementsTime = Date.now() - startAllElements;
          console.log(
            `⏱️  generateAllElementLocators (all) took ${allElementsTime}ms, found ${allElements.length} elements`
          );

          const startInteractable = Date.now();
          const interactableElements = generateAllElementLocators(
            sampleXML,
            true,
            driverName,
            {
              fetchableOnly: true,
            }
          );
          const interactableTime = Date.now() - startInteractable;
          console.log(
            `⏱️  generateAllElementLocators (interactable) took ${interactableTime}ms, found ${interactableElements.length} elements`
          );

          const totalTime = Date.now() - startPageSource;
          console.log(
            `⏱️  Total generate_locators execution time: ${totalTime}ms`
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  interactableElements,
                  message: 'Page source retrieved successfully',
                  instruction: `This the locators for the current page. Use this to generate code for the current page.
                     Using the template provided by generate://code-with-locators resource.`,
                }),
              },
            ],
          };
        } catch (parseError: any) {
          console.error('Error parsing XML:', parseError);
          throw new Error(`Failed to parse XML: ${parseError.message}`);
        }
      } catch (error: any) {
        console.error('Error getting page source:', error);
        throw new Error(`Failed to get page source: ${error.message}`);
      }
    },
  });
}
