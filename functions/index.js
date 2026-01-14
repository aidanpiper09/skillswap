const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

const assertAdmin = async (context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }

  return userDoc.data();
};

const toIsoString = (timestamp) => {
  if (!timestamp) {
    return null;
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toISOString();
};

exports.getAdminSessionCounts = functions.https.onCall(async (_data, context) => {
  await assertAdmin(context);

  const sessionsSnap = await db.collection('sessions').get();
  const byStatus = {};

  sessionsSnap.forEach((doc) => {
    const status = doc.data().status || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  return {
    totalSessions: sessionsSnap.size,
    byStatus,
  };
});

exports.getAdminRatingsSummary = functions.https.onCall(async (_data, context) => {
  await assertAdmin(context);

  const [ratingsSnap, sessionsSnap] = await Promise.all([
    db.collection('ratings').get(),
    db.collection('sessions').select('skill').get(),
  ]);

  const skillBySessionId = new Map();
  sessionsSnap.forEach((doc) => {
    skillBySessionId.set(doc.id, doc.data().skill || 'Unknown');
  });

  const scoreBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const skillRatings = new Map();
  let totalScore = 0;

  ratingsSnap.forEach((doc) => {
    const rating = doc.data();
    const score = Number(rating.score) || 0;
    const normalizedScore = Math.min(Math.max(score, 1), 5);
    scoreBreakdown[normalizedScore] = (scoreBreakdown[normalizedScore] || 0) + 1;
    totalScore += normalizedScore;

    const skill = skillBySessionId.get(rating.sessionId) || 'Unknown';
    const existing = skillRatings.get(skill) || { totalScore: 0, totalRatings: 0 };
    skillRatings.set(skill, {
      totalScore: existing.totalScore + normalizedScore,
      totalRatings: existing.totalRatings + 1,
    });
  });

  const averageBySkill = Array.from(skillRatings.entries())
    .map(([skill, data]) => ({
      skill,
      averageScore: data.totalRatings ? data.totalScore / data.totalRatings : 0,
      totalRatings: data.totalRatings,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  return {
    totalRatings: ratingsSnap.size,
    averageScore: ratingsSnap.size ? totalScore / ratingsSnap.size : 0,
    scoreBreakdown,
    averageBySkill,
  };
});

exports.getAdminTopSkills = functions.https.onCall(async (_data, context) => {
  await assertAdmin(context);

  const sessionsSnap = await db.collection('sessions').select('skill').get();
  const skillCounts = {};

  sessionsSnap.forEach((doc) => {
    const skill = doc.data().skill;
    if (skill) {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    }
  });

  const topSkills = Object.entries(skillCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { topSkills };
});

exports.getAdminRecentActivity = functions.https.onCall(async (_data, context) => {
  await assertAdmin(context);

  const logsSnap = await db
    .collection('auditLogs')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();

  const activity = logsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      action: data.action || 'UNKNOWN_ACTION',
      timestamp: toIsoString(data.timestamp || data.createdAt),
    };
  });

  return { activity };
});
