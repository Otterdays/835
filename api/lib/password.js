// [TRACE: ARCHITECTURE.md]
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const derived = await scryptAsync(password, salt, KEYLEN, SCRYPT_OPTS);
    return {
        salt,
        hash: Buffer.from(derived).toString('hex'),
        algo: 'scrypt',
        schemaVersion: 1
    };
}

async function verifyPassword(password, salt, hashHex) {
    const derived = await scryptAsync(password, salt, KEYLEN, SCRYPT_OPTS);
    const expected = Buffer.from(hashHex, 'hex');
    const actual = Buffer.from(derived);
    if (expected.length !== actual.length) {
        return false;
    }
    return timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
