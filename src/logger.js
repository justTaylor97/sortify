const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  transports: [
    //
    // - Write all logs with level `error` and above to `error.log`
    new winston.transports.File({
      filename: "error.log",
      level: "error",
      format: winston.format.json(),
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf((info) => {
          return info.message;
        })
      ),
    }),
  ],
});

module.exports = logger;
