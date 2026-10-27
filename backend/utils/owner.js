const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

/**
 * Filter matching every document that belongs to a user.
 *
 * Why not `Model.find({ userId })`? Mongoose casts `userId` to an ObjectId, so a document whose
 * `userId` was stored as a *string* (hand-inserted, imported, or written by an older version) is
 * never matched: the data exists in MongoDB but never appears in the app. Matching both forms
 * fixes that without modifying any stored record. Documents with NO userId at all are
 * deliberately never matched (they would leak between users) - see scripts/claim-legacy-data.js.
 */
function ownerFilter(userId) {
  const id = String(userId);
  const ids = [id];
  if (ObjectId.isValid(id)) ids.unshift(new ObjectId(id));
  return { userId: { $in: ids } };
}

/** Raw driver collection for a Mongoose model (bypasses query casting, returns plain objects). */
function rawCollection(Model) {
  return mongoose.connection.db.collection(Model.collection.name);
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

module.exports = { ownerFilter, rawCollection, round2, round4, ObjectId };
