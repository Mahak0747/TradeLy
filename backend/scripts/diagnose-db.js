#!/usr/bin/env node
/**
 * READ-ONLY diagnostic: "my data is in MongoDB but the app shows nothing" - which cause is it?
 *   node scripts/diagnose-db.js [--email you@example.com]
 * Uses MONGO_URL from .env. Never writes anything.
 */
require("dotenv").config({ quiet: true });
const { MongoClient, ObjectId } = require("mongodb");

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : undefined; };
const COLS = ["funds", "holdings", "positions", "orders"];

(async () => {
  if (!process.env.MONGO_URL) { console.error("MONGO_URL is not set (backend/.env)"); process.exit(1); }
  const client = await MongoClient.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
  const db = client.db(); // database named in the URL, else "test"
  console.log(`\nConnected. Database used by the app: "${db.databaseName}"`);
  if (db.databaseName === "test") console.log("  ! No database name in MONGO_URL -> MongoDB uses \"test\". If your data lives in another database, add its name: ...mongodb.net/<database>?...");

  try {
    const { databases } = await client.db().admin().listDatabases();
    console.log("Databases visible to this user:", databases.map((d) => d.name).join(", "));
  } catch { console.log("(this user may not list other databases)"); }

  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
  console.log("Collections here:", [...existing].join(", ") || "(none)");

  const users = await db.collection("users").countDocuments();
  console.log(`\nusers: ${users}`);
  console.log("\ncollection   total  userId=ObjectId  userId=string  userId missing  userId matches no user");
  const userIds = new Set((await db.collection("users").find({}, { projection: { _id: 1 } }).toArray()).map((u) => String(u._id)));
  for (const name of COLS) {
    const c = db.collection(name);
    const total = await c.countDocuments();
    const oid = await c.countDocuments({ userId: { $type: "objectId" } });
    const str = await c.countDocuments({ userId: { $type: "string" } });
    const missing = await c.countDocuments({ $or: [{ userId: { $exists: false } }, { userId: null }] });
    let orphan = 0;
    for await (const d of c.find({ userId: { $exists: true, $ne: null } }, { projection: { userId: 1 } })) if (!userIds.has(String(d.userId))) orphan++;
    console.log(`${name.padEnd(12)} ${String(total).padStart(5)}  ${String(oid).padStart(14)}  ${String(str).padStart(13)}  ${String(missing).padStart(13)}  ${String(orphan).padStart(10)}`);
    if (!existing.has(name) && total === 0) console.log(`  (collection "${name}" does not exist in this database)`);
  }

  const email = arg("--email");
  if (email) {
    const u = await db.collection("users").findOne({ email: email.trim().toLowerCase() });
    if (!u) console.log(`\nNo user with email ${email}`);
    else {
      console.log(`\nUser ${u.email} (_id ${u._id}) - what the API will return for them:`);
      for (const name of COLS) {
        const n = await db.collection(name).countDocuments({ userId: { $in: [u._id, String(u._id)] } });
        console.log(`  ${name.padEnd(10)} ${n}`);
      }
    }
  }

  console.log(`
How to read this:
 - "userId=string" > 0      : handled automatically by this version (no change needed).
 - "userId missing" > 0     : old single-user records. The app deliberately does not show them to anyone.
                              Assign them with:  npm run claim-legacy -- --email you@example.com   (dry run first)
 - "matches no user" > 0    : records of deleted/other accounts; harmless, never shown.
 - all totals 0             : wrong database/cluster in MONGO_URL (see database name above).`);
  await client.close();
})().catch((e) => { console.error("Diagnostic failed:", e.message); process.exit(1); });
