import fs from 'node:fs';
import admin from 'firebase-admin';

const [,, uid] = process.argv;

if (!uid) {
  console.error('Usage: node scripts/setAdminClaim.mjs <uid>');
  process.exit(1);
}

const { FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH } = process.env;

let credential;
if (FIREBASE_SERVICE_ACCOUNT_JSON) {
  credential = admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON));
} else if (FIREBASE_SERVICE_ACCOUNT_PATH) {
  const serviceAccount = JSON.parse(fs.readFileSync(FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
  credential = admin.credential.cert(serviceAccount);
} else {
  credential = admin.credential.applicationDefault();
}

admin.initializeApp({
  credential,
  projectId: FIREBASE_PROJECT_ID
});

await admin.auth().setCustomUserClaims(uid, { admin: true });
await admin.firestore().doc(`users/${uid}`).set(
  {
    role: 'admin',
    adminGrantedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  { merge: true }
);

console.log(`Granted admin claim to ${uid}.`);
