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
