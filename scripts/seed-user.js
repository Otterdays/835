#!/usr/bin/env node
// [TRACE: ARCHITECTURE.md]
// Seed or update a Mongo user: node scripts/seed-user.js <username> <password> [role]
require('dotenv').config?.();
const fs = require('fs');
const path = require('path');

// Load .env manually if dotenv not installed
(function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        return;
    }
    const text = fs.readFileSync(envPath, 'utf8');
    text.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) {
            process.env[m[1].trim()] = m[2].trim();
        }
    });
})();

const { getDb } = require('../api/lib/mongo');
const { hashPassword } = require('../api/lib/password');

async function main() {
    const username = String(process.argv[2] || '')
        .trim()
        .toLowerCase();
    const password = String(process.argv[3] || '');
    const role = String(process.argv[4] || 'admin');
    if (!username || !password) {
        console.error('Usage: node scripts/seed-user.js <username> <password> [role]');
        process.exit(1);
    }

    const hashed = await hashPassword(password);
    const db = await getDb();

    // Moderate schema validation for users collection
    try {
        await db.command({
            collMod: 'users',
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: [
                        'username',
                        'passwordHash',
                        'passwordSalt',
                        'role',
                        'active',
                        'schemaVersion'
                    ],
                    properties: {
                        username: { bsonType: 'string', minLength: 2, maxLength: 64 },
                        passwordHash: { bsonType: 'string' },
                        passwordSalt: { bsonType: 'string' },
                        role: { enum: ['admin', 'member', 'steward'] },
                        active: { bsonType: 'bool' },
                        schemaVersion: { bsonType: 'int' },
                        createdAt: { bsonType: 'date' },
                        updatedAt: { bsonType: 'date' }
                    },
                    additionalProperties: true
                }
            },
            validationLevel: 'moderate',
            validationAction: 'error'
        });
    } catch (err) {
        if (err.codeName === 'NamespaceNotFound') {
            await db.createCollection('users', {
                validator: {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: [
                            'username',
                            'passwordHash',
                            'passwordSalt',
                            'role',
                            'active',
                            'schemaVersion'
                        ],
                        properties: {
                            username: { bsonType: 'string' },
                            passwordHash: { bsonType: 'string' },
                            passwordSalt: { bsonType: 'string' },
                            role: { enum: ['admin', 'member', 'steward'] },
                            active: { bsonType: 'bool' },
                            schemaVersion: { bsonType: 'int' }
                        }
                    }
                },
                validationLevel: 'moderate'
            });
        } else {
            console.warn('users validator note:', err.message);
        }
    }

    const now = new Date();
    await db.collection('users').updateOne(
        { username },
        {
            $set: {
                username,
                passwordHash: hashed.hash,
                passwordSalt: hashed.salt,
                role,
                active: true,
                schemaVersion: 1,
                updatedAt: now
            },
            $setOnInsert: { createdAt: now }
        },
        { upsert: true }
    );
    console.log(`User ready: ${username} (${role})`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
