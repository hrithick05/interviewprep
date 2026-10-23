import { app } from "./app.js";
import { env } from "./config.js";

const server = app.listen(env.PORT, () => {
  console.info(`PrepForge API listening on http://localhost:${env.PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
