import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [uid, adminFlag = 'true'] = process.argv.slice(2);

if (!uid) {
  console.error('Usage: node scripts/setAdminClaim.js <uid> [true|false]');
  process.exit(1);
}

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

const app = initializeApp(
  serviceAccount ? { credential: cert(serviceAccount) } : { credential: applicationDefault() }
);

const isAdmin = adminFlag === 'true';

try {
  await getAuth(app).setCustomUserClaims(uid, { admin: isAdmin });
  console.log(`Set admin claim to ${isAdmin} for UID ${uid}.`);
} catch (error) {
  console.error('Failed to set custom claims:', error);
  process.exit(1);
}
