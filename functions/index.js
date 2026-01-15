const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const assertAuth = (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }
};

const assertAdmin = (request) => {
  assertAuth(request);
  if (request.auth.token?.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }
};

const logAudit = async ({ action, userId, sessionId, targetUserId, metadata }) => {
  await db.collection('auditLogs').add({
    action,
    userId,
    sessionId: sessionId || null,
    targetUserId: targetUserId || null,
    metadata: metadata || null,
    createdAt: FieldValue.serverTimestamp()
  });
};

const buildAchievementUpdates = (currentAchievements = [], sessionCount) => {
  const updates = [];
  if (sessionCount === 1 && !currentAchievements.includes('first_session')) {
    updates.push('first_session');
  }
  if (sessionCount === 5 && !currentAchievements.includes('five_sessions')) {
    updates.push('five_sessions');
  }
  if (sessionCount === 10 && !currentAchievements.includes('ten_sessions')) {
    updates.push('ten_sessions');
  }
  return updates;
};

exports.logAuditEvent = onCall(async (request) => {
  assertAuth(request);
  const { action, sessionId, targetUserId, metadata } = request.data || {};
  if (!action) {
    throw new HttpsError('invalid-argument', 'Action is required for audit logging.');
  }

  await logAudit({
    action,
    userId: request.auth.uid,
    sessionId,
    targetUserId,
    metadata
  });

  return { ok: true };
});

exports.updateSessionStatus = onCall(async (request) => {
  assertAuth(request);
  const { sessionId, status } = request.data || {};
  const validStatuses = ['accepted', 'declined', 'completed'];
  if (!sessionId || !validStatuses.includes(status)) {
    throw new HttpsError('invalid-argument', 'Session ID and valid status are required.');
  }

  const sessionRef = db.collection('sessions').doc(sessionId);

  await db.runTransaction(async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }

    const session = sessionSnap.data();
    const participants = session.participants || [];
    if (!participants.includes(request.auth.uid)) {
      throw new HttpsError('permission-denied', 'You are not a participant in this session.');
    }

    if (['accepted', 'declined'].includes(status) && session.providerId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Only the provider can accept or decline a session.');
    }

    if (status === 'completed' && session.status !== 'accepted') {
      throw new HttpsError('failed-precondition', 'Only accepted sessions can be completed.');
    }

    if (session.status === status) {
      return;
    }

    transaction.update(sessionRef, { status });

    if (status === 'completed') {
      const userRefs = participants.map((uid) => db.collection('users').doc(uid));
      const userSnaps = await Promise.all(userRefs.map((ref) => transaction.get(ref)));

      userSnaps.forEach((userSnap, idx) => {
        if (!userSnap.exists) {
          return;
        }
        const userData = userSnap.data();
        const sessionsCompleted = (userData.sessionsCompleted || 0) + 1;
        const achievements = userData.achievements || [];
        const newAchievements = buildAchievementUpdates(achievements, sessionsCompleted);
        const updates = { sessionsCompleted };
        if (newAchievements.length > 0) {
          updates.achievements = [...achievements, ...newAchievements];
        }
        transaction.update(userRefs[idx], updates);
      });
    }

    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      action: `SESSION_${status.toUpperCase()}`,
      userId: request.auth.uid,
      sessionId,
      createdAt: FieldValue.serverTimestamp()
    });
  });
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

exports.submitRating = onCall(async (request) => {
  assertAuth(request);
  const { sessionId, score, comment } = request.data || {};
  if (!sessionId || typeof score !== 'number') {
    throw new HttpsError('invalid-argument', 'Session ID and score are required.');
  }
  if (score < 1 || score > 5) {
    throw new HttpsError('invalid-argument', 'Score must be between 1 and 5.');
  }

  const sessionSnap = await db.collection('sessions').doc(sessionId).get();
  if (!sessionSnap.exists) {
    throw new HttpsError('not-found', 'Session not found.');
  }
  const session = sessionSnap.data();
  const participants = session.participants || [];
  if (!participants.includes(request.auth.uid)) {
    throw new HttpsError('permission-denied', 'You are not a participant in this session.');
  }
  if (session.status !== 'completed') {
    throw new HttpsError('failed-precondition', 'Ratings can only be submitted after completion.');
  }

  const rateeId = session.requesterId === request.auth.uid ? session.providerId : session.requesterId;
  if (!rateeId || rateeId === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'Invalid ratee for this session.');
  }

  const existingRatings = await db
    .collection('ratings')
    .where('sessionId', '==', sessionId)
    .where('raterId', '==', request.auth.uid)
    .limit(1)
    .get();

  if (!existingRatings.empty) {
    throw new HttpsError('already-exists', 'You have already rated this session.');
  }

  await db.collection('ratings').add({
    sessionId,
    raterId: request.auth.uid,
    rateeId,
    score,
    comment: comment || '',
    createdAt: FieldValue.serverTimestamp()
  });

  if (score === 5) {
    const rateeRef = db.collection('users').doc(rateeId);
    const rateeSnap = await rateeRef.get();
    if (rateeSnap.exists) {
      const achievements = rateeSnap.data().achievements || [];
      if (!achievements.includes('five_star')) {
        await rateeRef.update({ achievements: [...achievements, 'five_star'] });
      }
    }
  }

  await logAudit({
    action: 'RATING_SUBMITTED',
    userId: request.auth.uid,
    sessionId,
    targetUserId: rateeId
  });

  return { ok: true };
});

exports.deleteUser = onCall(async (request) => {
  assertAdmin(request);
  const { userId } = request.data || {};
  if (!userId) {
    throw new HttpsError('invalid-argument', 'User ID is required.');
  }

  await admin.auth().deleteUser(userId);
  await db.collection('users').doc(userId).delete();

  await logAudit({
    action: 'USER_DELETED',
    userId: request.auth.uid,
    targetUserId: userId
  });

  return { ok: true };
});

exports.createClub = onCall(async (request) => {
  assertAdmin(request);
  const { name, description } = request.data || {};
  if (!name) {
    throw new HttpsError('invalid-argument', 'Club name is required.');
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
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

initializeApp();

const db = getFirestore();
const auth = getAuth();

const requireAuth = (context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
};

const requireAdmin = async (uid) => {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin privileges required.');
  }
};

export const createAuditLog = onCall(async (request) => {
  requireAuth(request);

  const { action, sessionId, targetUserId, metadata } = request.data || {};

  if (!action) {
    throw new HttpsError('invalid-argument', 'Action is required.');
  }

  await db.collection('auditLogs').add({
    action,
    userId: request.auth.uid,
    sessionId: sessionId || null,
    targetUserId: targetUserId || null,
    metadata: metadata || null,
    createdAt: Timestamp.now()
  });

  return { status: 'logged' };
});

export const createSession = onCall(async (request) => {
  requireAuth(request);

  const { providerId, skill, startTime, location } = request.data || {};

  if (!providerId || !skill || !startTime) {
    throw new HttpsError('invalid-argument', 'providerId, skill, and startTime are required.');
  }

  const requesterId = request.auth.uid;
  const requesterDoc = await db.collection('users').doc(requesterId).get();
  const providerDoc = await db.collection('users').doc(providerId).get();

  if (!requesterDoc.exists || !providerDoc.exists) {
    throw new HttpsError('not-found', 'Requester or provider not found.');
  }

  const sessionRef = await db.collection('sessions').add({
    requesterId,
    requesterName: requesterDoc.data().name,
    providerId,
    providerName: providerDoc.data().name,
    skill,
    startTime: Timestamp.fromDate(new Date(startTime)),
    location: location || '',
    status: 'pending',
    participants: [requesterId, providerId],
    createdAt: FieldValue.serverTimestamp()
  });

  await db.collection('auditLogs').add({
    action: 'SESSION_REQUESTED',
    userId: requesterId,
    sessionId: sessionRef.id,
    createdAt: FieldValue.serverTimestamp()
  });

  return { sessionId: sessionRef.id };
});

export const updateSessionStatus = onCall(async (request) => {
  requireAuth(request);

  const { sessionId, status } = request.data || {};

  if (!sessionId || !status) {
    throw new HttpsError('invalid-argument', 'sessionId and status are required.');
  }

  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    throw new HttpsError('not-found', 'Session not found.');
  }

  const sessionData = sessionDoc.data();
  const userId = request.auth.uid;

  if (!sessionData.participants?.includes(userId)) {
    throw new HttpsError('permission-denied', 'Only session participants can update status.');
  }

  let sessionsCompleted;

  if (status === 'completed') {
    sessionsCompleted = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);
      const currentCount = userDoc.data()?.sessionsCompleted || 0;
      const newCount = currentCount + 1;
      transaction.update(userRef, { sessionsCompleted: newCount });
      return newCount;
    });
  }

  await sessionRef.update({ status });

  await db.collection('auditLogs').add({
    action: `SESSION_${status.toUpperCase()}`,
    userId,
    sessionId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { sessionsCompleted };
});

export const deleteUserAccount = onCall(async (request) => {
  requireAuth(request);

  const { targetUserId } = request.data || {};

  if (!targetUserId) {
    throw new HttpsError('invalid-argument', 'targetUserId is required.');
  }

  await requireAdmin(request.auth.uid);

  await Promise.all([
    auth.deleteUser(targetUserId),
    db.collection('users').doc(targetUserId).delete()
  ]);

  await db.collection('auditLogs').add({
    action: 'USER_DELETED',
    userId: request.auth.uid,
    targetUserId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { deleted: true };
});

export const createClub = onCall(async (request) => {
  requireAuth(request);

  const { name, description } = request.data || {};

  if (!name) {
    throw new HttpsError('invalid-argument', 'name is required.');
  }

  const clubRef = await db.collection('clubs').add({
    name,
    description: description || '',
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
    members: [request.auth.uid]
  });

  await logAudit({
    action: 'CLUB_CREATED',
    userId: request.auth.uid,
    targetUserId: clubRef.id
  });

  return { ok: true, clubId: clubRef.id };
});

exports.updateClubMembership = onCall(async (request) => {
  assertAdmin(request);
  const { clubId, memberId, action } = request.data || {};
  if (!clubId || !memberId || !['add', 'remove'].includes(action)) {
    throw new HttpsError('invalid-argument', 'Club ID, member ID, and action are required.');
  }

  const clubRef = db.collection('clubs').doc(clubId);
  const update = action === 'add'
    ? { members: FieldValue.arrayUnion(memberId) }
    : { members: FieldValue.arrayRemove(memberId) };

  await clubRef.update(update);

  await logAudit({
    action: action === 'add' ? 'CLUB_MEMBER_ADDED' : 'CLUB_MEMBER_REMOVED',
    userId: request.auth.uid,
    targetUserId: memberId,
    metadata: { clubId }
  });

  return { ok: true };
    createdBy: request.auth.uid,
    members: [request.auth.uid],
    createdAt: FieldValue.serverTimestamp()
  });

  await db.collection('auditLogs').add({
    action: 'CLUB_CREATED',
    userId: request.auth.uid,
    metadata: { clubId: clubRef.id },
    createdAt: FieldValue.serverTimestamp()
  });

  return { clubId: clubRef.id };
});

export const joinClub = onCall(async (request) => {
  requireAuth(request);

  const { clubId } = request.data || {};

  if (!clubId) {
    throw new HttpsError('invalid-argument', 'clubId is required.');
  }

  await db.collection('clubs').doc(clubId).update({
    members: FieldValue.arrayUnion(request.auth.uid)
  });

  await db.collection('auditLogs').add({
    action: 'CLUB_JOINED',
    userId: request.auth.uid,
    metadata: { clubId },
    createdAt: FieldValue.serverTimestamp()
  });

  return { joined: true };
import admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();

const db = admin.firestore();

const deleteQueryInBatches = async (query) => {
  let deletedCount = 0;
  while (true) {
    const snapshot = await query.limit(400).get();
    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    deletedCount += snapshot.size;
  }

  return deletedCount;
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export const deleteUserAndData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const requesterId = request.auth.uid;
  const targetUserId = request.data?.userId;
  if (!targetUserId || typeof targetUserId !== 'string') {
    throw new HttpsError('invalid-argument', 'userId is required.');
  }

  const requesterDoc = await db.collection('users').doc(requesterId).get();
  if (!requesterDoc.exists || requesterDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin privileges required.');
  }

  const sessionsQuery = db.collection('sessions').where('participants', 'array-contains', targetUserId);
  const sessionsSnapshot = await sessionsQuery.get();
  const sessionIds = sessionsSnapshot.docs.map((docSnap) => docSnap.id);

  await deleteQueryInBatches(sessionsQuery);

  if (sessionIds.length > 0) {
    const sessionChunks = chunkArray(sessionIds, 10);
    for (const chunk of sessionChunks) {
      const messagesBySessionQuery = db.collection('messages').where('sessionId', 'in', chunk);
      await deleteQueryInBatches(messagesBySessionQuery);
    }
  }

  await deleteQueryInBatches(db.collection('messages').where('fromUserId', '==', targetUserId));
  await deleteQueryInBatches(db.collection('ratings').where('raterId', '==', targetUserId));
  await deleteQueryInBatches(db.collection('ratings').where('rateeId', '==', targetUserId));
  await deleteQueryInBatches(db.collection('auditLogs').where('userId', '==', targetUserId));
  await deleteQueryInBatches(db.collection('auditLogs').where('targetUserId', '==', targetUserId));

  const clubsSnapshot = await db.collection('clubs').where('members', 'array-contains', targetUserId).get();
  if (!clubsSnapshot.empty) {
    const batch = db.batch();
    clubsSnapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        members: admin.firestore.FieldValue.arrayRemove(targetUserId)
      });
    });
    await batch.commit();
  }

  await db.collection('users').doc(targetUserId).delete();
  await admin.auth().deleteUser(targetUserId);

  await db.collection('auditLogs').add({
    action: 'USER_DELETED',
    userId: requesterId,
    targetUserId,
    timestamp: admin.firestore.Timestamp.now()
  });

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();

const allowedTransitions = {
  pending: ['accepted', 'declined'],
  accepted: ['completed']
};

export const updateSessionStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const { sessionId, status } = request.data || {};

  if (typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new HttpsError('invalid-argument', 'Session ID is required.');
  }

  if (typeof status !== 'string' || status.trim() === '') {
    throw new HttpsError('invalid-argument', 'Status is required.');
  }

  const db = getFirestore();
  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    throw new HttpsError('not-found', 'Session not found.');
  }

  const session = sessionSnap.data();
  const participants = session.participants || [session.requesterId, session.providerId].filter(Boolean);

  if (!participants.includes(request.auth.uid)) {
    throw new HttpsError('permission-denied', 'Only participants can update session status.');
  }

  const currentStatus = session.status || 'pending';
  const allowedNext = allowedTransitions[currentStatus] || [];

  if (!allowedNext.includes(status)) {
    throw new HttpsError('failed-precondition', `Invalid status transition from ${currentStatus} to ${status}.`);
  }

  await sessionRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp()
  });

  if (status === 'completed') {
    await db.collection('users').doc(request.auth.uid).update({
      sessionsCompleted: FieldValue.increment(1)
    });
  }

  await db.collection('auditLogs').add({
    action: `SESSION_${status.toUpperCase()}`,
    userId: request.auth.uid,
    sessionId,
    timestamp: FieldValue.serverTimestamp()
  });

  return { status };
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
