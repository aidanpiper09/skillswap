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
});
