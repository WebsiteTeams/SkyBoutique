// Local MongoDB for development (no installation needed). Data persists in ./.data/db
// Usage: npm run db     (keep running in its own terminal)
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";

fs.mkdirSync(".data/db", { recursive: true });
const server = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath: ".data/db", storageEngine: "wiredTiger" },
});
console.log("MongoDB running at", server.getUri());
console.log("Press Ctrl+C to stop.");
const stop = async () => { await server.stop({ doCleanup: false }); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
