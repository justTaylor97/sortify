const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
      if (info.metadata.stack != undefined) {
        return info.metadata.stack;
      } else {
        return info.message;
      }
    })
  ),
  transports: [
    //
    // - Write all logs with level `error` and above to `error.log`
    new winston.transports.File({
      filename: `${__dirname}/error.log`,
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.prettyPrint()
      ),
    }),
    new winston.transports.Console({
      format: winston.format.colorize({ all: true }),
    }),
  ],
});

switch (process.env.LEVEL) {
  case "error":
  case "warn":
  case "info":
  case "http":
  case "verbose":
  case "debug":
  case "silly":
    logger.level = process.env.LEVEL;
    logger.info(`Logging in ${logger.level} mode.`);
    break;
  case undefined:
    break;
  default:
    logger.warn(
      `${process.env.LEVEL} is not a valid logging level. Refer to https://github.com/winstonjs/winston#logging-levels for valid levels.`
    );
    break;
}

module.exports = logger;
