"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
async function startServer() {
    try {
        const app = await (0, app_1.createApp)();
        app.listen(config_1.config.port, () => {
            console.log(`🚀 Digital Heroes server running on http://localhost:${config_1.config.port}`);
            console.log(`📡 API Base: http://localhost:${config_1.config.port}/api`);
        });
    }
    catch (err) {
        console.error('Fatal error starting server:', err);
        process.exit(1);
    }
}
startServer();
