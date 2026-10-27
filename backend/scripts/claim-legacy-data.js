#!/usr/bin/env node
/**
 * Assign OLD records that have no userId to one account. DRY RUN unless --apply is passed.
 *   node scripts/claim-legacy-data.js --email you@example.com            (shows what would change)
 *   node scripts/claim-legacy-data.js --email you@example.com --apply    (writes)
 * Only documents WITHOUT a userId are touched, and only the userId field is set.
 * Take a backup first (mongodump / Atlas snapshot). Funds are skipped if the user already has one.
 */
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : undefined; };
const apply = process.argv.includes("--apply");
const NO_OWNER = { $or: [{ userId: { $exists: false } }, { userId: null }] };

(async () => {
  const email = (arg("--email") || "").trim().toLowerCase();
  if (!email || !process.env.MONGO_URL) { console.error("Usage: claim-legacy-data.js --email <address> [--apply]   (needs MONGO_URL)"); process.exit(1); }
  const client = await MongoClient.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
  const db = client.db();
  const user = await db.collection("users").findOne({ email });
  if (!user) { console.error(`No user ${email} in database "${db.databaseName}"`); process.exit(1); }
  console.log(`${apply ? "APPLYING" : "DRY RUN"} - database "${db.databaseName}", user ${user.email} (${user._id})`);

  for (const name of ["holdings", "positions", "orders", "funds"]) {
    const col = db.collection(name);
    const n = await col.countDocuments(NO_OWNER);
    if (name === "funds" && n > 0 && (await col.countDocuments({ userId: { $in: [user._id, String(user._id)] } })) > 0) {
      console.log(`  funds       ${n} ownerless, SKIPPED (user already has a fund document)`); continue;
    }
    console.log(`  ${name.padEnd(11)} ${n} ownerless document(s)`);
    if (apply && n > 0) console.log(`              -> assigned ${(await col.updateMany(NO_OWNER, { $set: { userId: user._id } })).modifiedCount}`);
  }
  if (!apply) console.log("\nNothing written. Re-run with --apply to assign.");
  await client.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
