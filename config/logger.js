const winston = require('winston');

const isProduction = process.env.NODE_ENV === 'production';

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    isProduction
        ? winston.format.json()
        : winston.format.combine(
              winston.format.colorize({ all: true }),
              winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                  const metaKeys = Object.keys(meta).filter((key) => key !== 'service');
                  const metaStr = metaKeys.length ? ` ${JSON.stringify(meta)}` : '';
                  const stackStr = stack ? `\n${stack}` : '';
                  return `${timestamp} [${level}]: ${message}${metaStr}${stackStr}`;
              })
          )
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    defaultMeta: { service: 'school-erp-api' },
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
    ],
});

const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        };

        if (res.statusCode >= 500) {
            logger.error(`${req.method} ${req.originalUrl} ${res.statusCode}`, logData);
        } else if (res.statusCode >= 400) {
            logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode}`, logData);
        } else {
            logger.http(`${req.method} ${req.originalUrl} ${res.statusCode}`, logData);
        }
    });

    next();
};

const errorLogger = (err, req, res, next) => {
    logger.error(err.message, {
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    next(err);
};

module.exports = { logger, requestLogger, errorLogger };
