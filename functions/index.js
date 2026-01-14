const functions = require('firebase-functions');
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

  return { success: true };
});
