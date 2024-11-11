// Import Third-party Dependencies
import pino from "pino";

const logger = pino({
  // TODO: info
  level: "debug",
  transport: {
    target: "pino-pretty"
  }
});

export { logger };
