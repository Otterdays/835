#!/usr/bin/env node
// [TRACE: ACCOUNTS.md]
// Officer tool for accounts. Verified titles (badges) and roles can only be changed here,
// never from the website, so nobody can self-assign "Shop Steward".
//
//   node scripts/manage-user.js list
//   node scripts/manage-user.js badge <username> add|remove <badge-id>
//   node scripts/manage-user.js role <username> member|steward|admin
//   node scripts/manage-user.js password <username> <new-password>
//   node scripts/manage-user.js deactivate|activate <username>
//   node scripts/manage-user.js badges            (list valid badge ids)
const fs = require('fs');
const path = require('path');

(function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        return;
    }
    fs.readFileSync(envPath, 'utf8')
        .split(/\r?\n/)
        .forEach((line) => {
            const m = line.match(/^([^#=]+)=(.*)$/);
            if (m && !process.env[m[1].trim()]) {
                process.env[m[1].trim()] = m[2].trim();
            }
        });
})();

const { getDb } = require('../api/lib/mongo');
const { hashPassword } = require('../api/lib/password');
const schema = require('../api/_lib/profile-schema');
const accounts = require('../api/_lib/accounts');

const ROLES = ['member', 'steward', 'admin'];

function usage(message) {
    if (message) {
        console.error(message);
    }
    console.error(fs.readFileSync(__filename, 'utf8').split('\n').slice(3, 11).join('\n').replace(/^\/\/ ?/gm, ''));
    process.exit(1);
}

async function main() {
    const [command, rawUser, ...rest] = process.argv.slice(2);
    if (command === 'badges') {
        Object.entries(schema.BADGES).forEach(([id, label]) => console.log(`${id.padEnd(22)} ${label}`));
        return;
    }
    if (!command) {
        usage();
    }
    const db = await getDb();

    if (command === 'list') {
        const users = await db.collection('users').find({}).sort({ username: 1 }).toArray();
        const profiles = await db.collection('profiles').find({}).toArray();
        const byKey = new Map(profiles.map((p) => [p.username, p]));
        users.forEach((u) => {
            const p = byKey.get(u.username);
            console.log(
                `${u.username.padEnd(22)} ${String(u.role).padEnd(8)} ${u.active ? 'active  ' : 'DISABLED'} badges: ${
                    (p && p.badges && p.badges.join(',')) || '-'
                }`
            );
        });
        return;
    }

    const username = String(rawUser || '').trim().toLowerCase();
    if (!username) {
        usage('Username required.');
    }
    const user = await db.collection('users').findOne({ username });
    if (!user) {
        usage(`No account named "${username}".`);
    }

    if (command === 'badge') {
        const [action, id] = rest;
        if (!['add', 'remove'].includes(action) || !Object.prototype.hasOwnProperty.call(schema.BADGES, id)) {
            usage('Use: badge <username> add|remove <badge-id> (see "badges" for ids).');
        }
        await accounts.ensureProfile(db, user);
        await db
            .collection('profiles')
            .updateOne(
                { username },
                action === 'add' ? { $addToSet: { badges: id } } : { $pull: { badges: id } }
            );
        console.log(`${action === 'add' ? 'Awarded' : 'Removed'} "${schema.BADGES[id]}" for ${username}.`);
    } else if (command === 'role') {
        const [role] = rest;
        if (!ROLES.includes(role)) {
            usage(`Role must be one of: ${ROLES.join(', ')}.`);
        }
        await db.collection('users').updateOne({ username }, { $set: { role, updatedAt: new Date() } });
        console.log(`${username} is now role "${role}". They need to sign in again to pick it up.`);
    } else if (command === 'password') {
        const [password] = rest;
        schema.validatePassword(password, username);
        const hashed = await hashPassword(password);
        const now = new Date();
        await db.collection('users').updateOne(
            { username },
            {
                $set: {
                    passwordHash: hashed.hash,
                    passwordSalt: hashed.salt,
                    passwordChangedAt: now,
                    updatedAt: now
                }
            }
        );
        console.log(`Password reset for ${username}. All their old sessions are signed out.`);
    } else if (command === 'deactivate' || command === 'activate') {
        await db
            .collection('users')
            .updateOne({ username }, { $set: { active: command === 'activate', updatedAt: new Date() } });
        console.log(`${username} is now ${command === 'activate' ? 'active' : 'disabled'}.`);
    } else {
        usage(`Unknown command "${command}".`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err.message || err);
        process.exit(1);
    });
