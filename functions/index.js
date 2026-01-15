const functions = require('firebase-functions');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

const assertAuthenticated = (context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
};

const assertAdmin = async (context) => {
  assertAuthenticated(context);
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
  }
};

exports.logAuditEvent = functions.https.onCall(async (data, context) => {
  assertAuthenticated(context);
  const { action, sessionId, targetUserId, metadata } = data || {};

  if (!action) {
    throw new functions.https.HttpsError('invalid-argument', 'Action is required.');
  }

  await db.collection('auditLogs').add({
    action,
    userId: context.auth.uid,
    sessionId: sessionId || null,
    targetUserId: targetUserId || null,
    metadata: metadata || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

exports.changeSessionStatus = functions.https.onCall(async (data, context) => {
  assertAuthenticated(context);
  const { sessionId, status } = data || {};
  const allowedStatuses = ['pending', 'accepted', 'completed', 'cancelled'];

  if (!sessionId || !status || !allowedStatuses.includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid sessionId and status are required.');
  }

  const sessionRef = db.collection('sessions').doc(sessionId);
  const userRef = db.collection('users').doc(context.auth.uid);

  await db.runTransaction(async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);

    if (!sessionSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found.');
    }

    const session = sessionSnap.data();
    if (!session.participants || !session.participants.includes(context.auth.uid)) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized for this session.');
const requireAdmin = async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  const userData = userDoc.data();
  if (userData.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  return userData;
};

const logAudit = async (action, actorId, metadata = {}) => {
  await db.collection('auditLogs').add({
    action,
    actorId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...metadata
  });
};

const toIsoString = (timestamp) => {
  if (!timestamp) {
    return null;
  }
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return null;
};

exports.getAdminReports = onCall(async (request) => {
  await requireAdmin(request);

  const [usersSnap, sessionsSnap, ratingsSnap, flagsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('sessions').get(),
    db.collection('ratings').get(),
    db.collection('moderationFlags').get()
  ]);

  const userCounts = {
    totalUsers: usersSnap.size,
    admins: 0,
    students: 0
  };

  usersSnap.forEach((docSnap) => {
    const role = docSnap.data().role || 'student';
    if (role === 'admin') {
      userCounts.admins += 1;
    } else {
      userCounts.students += 1;
    }
  });

  const sessionStats = {
    totalSessions: sessionsSnap.size,
    pending: 0,
    accepted: 0,
    completed: 0,
    declined: 0
  };

  const skillCounts = {};
  sessionsSnap.forEach((docSnap) => {
    const session = docSnap.data();
    if (session.skill) {
      skillCounts[session.skill] = (skillCounts[session.skill] || 0) + 1;
    }
    if (session.status && Object.prototype.hasOwnProperty.call(sessionStats, session.status)) {
      sessionStats[session.status] += 1;
    }
  });

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const ratingsSummary = {
    totalRatings: ratingsSnap.size,
    averageScore: 0,
    fiveStarRate: 0,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
  };

  let ratingSum = 0;
  ratingsSnap.forEach((docSnap) => {
    const score = docSnap.data().score;
    if (typeof score === 'number') {
      ratingSum += score;
      ratingsSummary.distribution[score] = (ratingsSummary.distribution[score] || 0) + 1;
    }
  });

  if (ratingsSummary.totalRatings > 0) {
    ratingsSummary.averageScore = ratingSum / ratingsSummary.totalRatings;
    ratingsSummary.fiveStarRate = Math.round(
      (ratingsSummary.distribution[5] / ratingsSummary.totalRatings) * 100
    );
  }

  const moderationFlags = {
    totalFlags: flagsSnap.size,
    openFlags: 0,
    resolvedFlags: 0
  };

  flagsSnap.forEach((docSnap) => {
    const status = docSnap.data().status || 'open';
    if (status === 'resolved') {
      moderationFlags.resolvedFlags += 1;
    } else {
      moderationFlags.openFlags += 1;
    }
  });

  return {
    userCounts,
    sessionStats,
    ratingsSummary,
    moderationFlags,
    topSkills
  };
});

exports.getAdminDashboardData = onCall(async (request) => {
  await requireAdmin(request);

  const [usersSnap, sessionsSnap, logsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('sessions').get(),
    db.collection('auditLogs').orderBy('createdAt', 'desc').limit(25).get()
  ]);

  const users = usersSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || 'Unknown',
      email: data.email || '',
      role: data.role || 'student',
      sessionsCompleted: data.sessionsCompleted || 0,
      createdAt: toIsoString(data.createdAt)
    };
  });

  const sessions = sessionsSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      skill: data.skill || '',
      status: data.status || 'pending',
      requesterName: data.requesterName || '',
      providerName: data.providerName || '',
      startTime: toIsoString(data.startTime),
      location: data.location || ''
    };
  });

  const auditLogs = logsSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      action: data.action || 'UNKNOWN',
      actorId: data.actorId || data.userId || null,
      targetUserId: data.targetUserId || null,
      sessionId: data.sessionId || null,
      createdAt: data.createdAt || data.timestamp || null
    };
  });

  return {
    users,
    sessions,
    auditLogs
  };
});

exports.adminDeleteUser = onCall(async (request) => {
  await requireAdmin(request);

  const targetUserId = request.data?.targetUserId;
  if (!targetUserId || typeof targetUserId !== 'string') {
    throw new HttpsError('invalid-argument', 'targetUserId is required.');
  }

  await db.collection('users').doc(targetUserId).delete();
  try {
    await admin.auth().deleteUser(targetUserId);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
  }

  await logAudit('ADMIN_USER_DELETED', request.auth.uid, {
    targetUserId
  });

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
      const userSnap = await transaction.get(userRef);
      if (userSnap.exists) {
        const userData = userSnap.data();
        const currentCount = userData.sessionsCompleted || 0;
        const newCount = currentCount + 1;
        const existingAchievements = userData.achievements || [];
        const newAchievements = [];

        if (newCount === 1 && !existingAchievements.includes('first_session')) {
          newAchievements.push('first_session');
        }
        if (newCount === 5 && !existingAchievements.includes('five_sessions')) {
          newAchievements.push('five_sessions');
        }
        if (newCount === 10 && !existingAchievements.includes('ten_sessions')) {
          newAchievements.push('ten_sessions');
        }

        transaction.update(userRef, {
          sessionsCompleted: newCount,
          achievements: [...existingAchievements, ...newAchievements]
        });
      }
    }
  });

  await db.collection('auditLogs').add({
    action: `SESSION_${status.toUpperCase()}`,
    userId: context.auth.uid,
    sessionId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

exports.submitRating = functions.https.onCall(async (data, context) => {
  assertAuthenticated(context);
  const { sessionId, score, comment } = data || {};

  if (!sessionId || typeof score !== 'number' || score < 1 || score > 5) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid sessionId and score are required.');
  }

  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Session not found.');
  }

  const session = sessionSnap.data();
  if (!session.participants || !session.participants.includes(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized for this session.');
  }

  if (session.status !== 'completed') {
    throw new functions.https.HttpsError('failed-precondition', 'Ratings require a completed session.');
  }

  const existingRatingSnap = await db.collection('ratings')
    .where('sessionId', '==', sessionId)
    .where('raterId', '==', context.auth.uid)
    .limit(1)
    .get();

  if (!existingRatingSnap.empty) {
    throw new functions.https.HttpsError('already-exists', 'Rating already submitted.');
  }

  const rateeId = session.requesterId === context.auth.uid ? session.providerId : session.requesterId;

  await db.collection('ratings').add({
    sessionId,
    raterId: context.auth.uid,
    rateeId,
    score,
    comment: comment || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
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
    await db.runTransaction(async (transaction) => {
      const rateeSnap = await transaction.get(rateeRef);
      if (!rateeSnap.exists) {
        return;
      }
      const achievements = rateeSnap.data().achievements || [];
      if (!achievements.includes('five_star')) {
        transaction.update(rateeRef, { achievements: [...achievements, 'five_star'] });
      }
    });
  }

  await db.collection('auditLogs').add({
    action: 'RATING_SUBMITTED',
    userId: context.auth.uid,
    sessionId,
    targetUserId: rateeId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  await assertAdmin(context);
  const { userId } = data || {};

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required.');
  }

  await admin.auth().deleteUser(userId).catch(() => null);
  await db.collection('users').doc(userId).delete();

  await db.collection('auditLogs').add({
    action: 'USER_DELETED',
    userId: context.auth.uid,
    targetUserId: userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

exports.updateClubMembership = functions.https.onCall(async (data, context) => {
  await assertAdmin(context);
  const { clubId, userId, action, role } = data || {};

  if (!clubId || !userId || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'clubId, userId, and action are required.');
  }

  const memberRef = db.collection('clubs').doc(clubId).collection('members').doc(userId);

  if (action === 'add' || action === 'update') {
    await memberRef.set({
      role: role || 'member',
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    }, { merge: true });
  } else if (action === 'remove') {
    await memberRef.delete();
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'Action must be add, update, or remove.');
  }

  await db.collection('auditLogs').add({
    action: 'CLUB_MEMBERSHIP_UPDATED',
    userId: context.auth.uid,
    targetUserId: userId,
    metadata: { clubId, action, role: role || 'member' },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

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
