const { createPasswordManager, createTokenManager } = require('jay-auth-kit');
const { logger } = require('./logger');

const accessSecret = process.env.AUTH_ACCESS_SECRET || process.env.JWT_SECRET || 'sachhidanand_school_erp_secure_jwt_secret_key_2026';
const accessExpiresIn = Number(process.env.AUTH_ACCESS_EXPIRES_SECONDS || 7 * 24 * 60 * 60); // 7 days

let passwords;
let tokens;

try {
    passwords = createPasswordManager({ rounds: 12 });
    tokens = createTokenManager({
        accessSecret,
        accessExpiresIn,
        issuer: 'sachhidanand-erp',
        audience: 'sachhidanand-users'
    });
    logger.info('jay-auth-kit initialized successfully');
} catch (err) {
    logger.error('Failed to initialize jay-auth-kit', { stack: err.stack });
    throw err;
}

module.exports = { passwords, tokens };

