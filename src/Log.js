/** TODO
 * adjust output format, some examples here https://github.com/winstonjs/winston/issues/1134
 * list of logging levels https://github.com/winstonjs/winston#logging-levels
 *
 */
const version = require('../package.json').version;
const winston = require('winston');
const loggingLevel = 'info';

const myformat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.align(),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

export const log = winston.createLogger({
  silent: false,
  level: loggingLevel,
  transports: [
    new winston.transports.Console({
      format: myformat,
    }),
  ],
});

log.info(`Log: Axis-Streamer ${version}`);
log.info(`Log: logging-level is set to ${loggingLevel}`);
