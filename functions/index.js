const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

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

  return { success: true };
});
