import { createApp } from './app';
import { config } from './config';

async function startServer() {
  try {
    const app = await createApp();

    app.listen(config.port, () => {
      console.log(`🚀 Digital Heroes server running on http://localhost:${config.port}`);
      console.log(`📡 API Base: http://localhost:${config.port}/api`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
