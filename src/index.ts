import { createApp } from './app.js';
import { config } from './config.js';
import fs from 'fs';

function main(): void {
  // Ensure media directory exists
  if (!fs.existsSync(config.mediaDir)) {
    console.error(`Media directory does not exist: ${config.mediaDir}`);
    console.error('Please create the directory or set MEDIA_DIR environment variable.');
    process.exit(1);
  }

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${String(config.port)}`);
    console.log(`Media directory: ${config.mediaDir}`);
    if (config.hwAccel !== undefined && config.hwAccel !== '') {
      console.log(`Hardware acceleration: ${config.hwAccel}`);
    }
  });
}

main();
