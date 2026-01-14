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

  return { success: true };
});
