// Import Third-party Dependencies
import pino from "pino";

// CONSTANTS
const kDefaultLogLevel = "info";

const logger = pino({
  level: process.env.LOG_LEVEL ?? kDefaultLogLevel,
  transport: {
    target: "pino-pretty"
  }
});

export { logger };
