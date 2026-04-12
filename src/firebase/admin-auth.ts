import { adminAuth } from './admin';

/**
 * Verifies a Firebase ID token sent from the client.
 * Returns the decoded token if valid, otherwise throws an error.
 */
export async function verifyAdminToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('[AdminAuth] Token verification failed:', error);
    throw new Error('Unauthorized: Invalid or expired token');
  }
}
