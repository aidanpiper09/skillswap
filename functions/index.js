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
});
