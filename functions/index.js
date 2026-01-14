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
});
