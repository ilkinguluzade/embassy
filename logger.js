const fs = require('fs');
const path = require("path");
const winston = require('winston');
const { label, timestamp, prettyPrint } = winston.format;
const dailyRotateFile = require('winston-daily-rotate-file');

const logFormat = winston.format.printf(({ level, message, label }) => {
    const now = new Date();
    const timestamp = now.toLocaleString("en-GB", { timeZone: "Asia/Baku" });
    return `${level} Loqu | ${timestamp} tarixində [${label}] - Loqun məzmunu: ${message}`;
});

const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const Logger = winston.createLogger({
    defaultMeta: { api: 'Phalcon Sistemi' },
    format: winston.format.combine(
        label({ label: 'Phalcon Sistemi' }),
        timestamp(),
        prettyPrint(),
        logFormat
    ),
    transports: [
        new dailyRotateFile({
            datePattern: "DD-MM-YYYY",
            filename: path.join(logDirectory, "Phalcon-%DATE%.log"),
            maxFiles: '14d', // 14 günlük log dosyalarını saklar
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        })
    ]
});

class Log {
    LogError(message) {
        Logger.error(message);
    }
    LogInfo(message) {
        Logger.info(message);
    }
    LogWarning(message) {
        Logger.warn(message);
    }
    LogDebug(message) {
        Logger.debug(message);
    }
}

module.exports = Log;
