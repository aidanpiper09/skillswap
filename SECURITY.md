# Security & Privacy Strategy

## Transport Security
- **HTTPS-only in production:** The client blocks non-HTTPS access in production to ensure all traffic is protected in transit.
- **TLS enforcement:** Firebase endpoints require TLS and terminate HTTPS; traffic between the client and Firebase is always encrypted in transit.
- **HSTS recommendation:** Enable HTTP Strict Transport Security (HSTS) on the hosting layer to prevent protocol downgrades.

## Encryption Strategy for Sensitive Fields
Sensitive fields include:
- User bios (`users.bio`)
- Messages (`messages.body`)
- Ratings comments (`ratings.comment`)
- Club contact details (`clubDetails.contactEmail`)

**Baseline encryption:**
- Firebase automatically encrypts data at rest.
- TLS protects data in transit.

**Field-level encryption (recommended for sensitive text):**
- Encrypt sensitive fields client-side using the Web Crypto API (AES-GCM).
- Store only ciphertext, IV, and key metadata (e.g., key version) in Firestore.
- Manage encryption keys using a key management service (e.g., Google Cloud KMS) or per-user keys derived from user credentials.
- Rotate keys periodically and re-encrypt stored data as needed.

**Access control alignment:**
- Firestore security rules enforce privacy settings (profile visibility and request/message permissions), ensuring that even encrypted fields are only delivered to authorized users.
