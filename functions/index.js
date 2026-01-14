const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const VALID_ACTIONS = new Set([
  'USER_REGISTERED',
  'SESSION_REQUESTED',
  'USER_DELETED'
]);

const VALID_STATUS_TRANSITIONS = {
  pending: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],
  completed: []
};

exports.logAuditEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
  }

  const { action, sessionId, targetUserId } = data || {};

  if (!action || !VALID_ACTIONS.has(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid audit action.');
  }

  const payload = {
    action,
    userId: context.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (sessionId) {
    payload.sessionId = sessionId;
  }

  if (targetUserId) {
    payload.targetUserId = targetUserId;
  }

  await admin.firestore().collection('auditLogs').add(payload);

  return { ok: true };
});

exports.updateSessionStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
  }

  const { sessionId, status } = data || {};

  if (!sessionId || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Session id and status are required.');
  }

  const sessionRef = admin.firestore().collection('sessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Session not found.');
  }

  const session = sessionSnap.data();
  const participants = session.participants || [];

  if (!participants.includes(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'You are not a participant of this session.');
  }

  const currentStatus = session.status;
  const allowedNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedNextStatuses.includes(status)) {
    throw new functions.https.HttpsError('failed-precondition', 'Invalid session status transition.');
  }

  await sessionRef.update({ status });

  await admin.firestore().collection('auditLogs').add({
    action: `SESSION_${status.toUpperCase()}`,
    userId: context.auth.uid,
    sessionId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { status };
});
