const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.logAuditEvent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required to log audit events.");
  }

  const { action, sessionId, targetUserId, details } = request.data || {};

  if (!action || typeof action !== "string") {
    throw new HttpsError("invalid-argument", "Audit action is required.");
  }

  const auditRecord = {
    action,
    actorId: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (sessionId) {
    auditRecord.sessionId = sessionId;
  }

  if (targetUserId) {
    auditRecord.targetUserId = targetUserId;
  }

  if (details) {
    auditRecord.details = details;
  }

  await admin.firestore().collection("auditLogs").add(auditRecord);

  return { ok: true };
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

const deleteQueryBatch = async (baseQuery) => {
  const snapshot = await baseQuery.limit(500).get();
  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  if (snapshot.size === 500) {
    await deleteQueryBatch(baseQuery);
  }
};

exports.deleteUserCascade = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { userId } = data || {};
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required.');
  }

  const requesterId = context.auth.uid;
  const requesterSnap = await db.collection('users').doc(requesterId).get();
  if (!requesterSnap.exists || requesterSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }

  await deleteQueryBatch(db.collection('messages').where('fromUserId', '==', userId));
  await deleteQueryBatch(db.collection('ratings').where('raterId', '==', userId));
  await deleteQueryBatch(db.collection('ratings').where('rateeId', '==', userId));
  await deleteQueryBatch(db.collection('sessions').where('requesterId', '==', userId));
  await deleteQueryBatch(db.collection('sessions').where('providerId', '==', userId));
  await deleteQueryBatch(db.collection('sessions').where('participants', 'array-contains', userId));
  await deleteQueryBatch(db.collection('auditLogs').where('userId', '==', userId));
  await deleteQueryBatch(db.collection('auditLogs').where('targetUserId', '==', userId));

  await db.collection('users').doc(userId).delete();
  await admin.auth().deleteUser(userId);

  return { success: true };
});
