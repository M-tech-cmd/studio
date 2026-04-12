import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { verifyAdminToken } from '@/firebase/admin-auth';

/**
 * Backend API Endpoint: Updates Site Branding
 * Bypasses client-side security rules by using Admin SDK.
 * Verifies admin status before committing changes.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyAdminToken(token);
    
    // Explicit Admin Authorization Check
    const isAdmin = 
      decodedToken.email === 'kimaniemma20@gmail.com' ||
      decodedToken.uid === 'BKSmmIdohYQHlao5V9eZ9JQyaEV2' ||
      decodedToken.uid === 'sxiZRGIEshOkSROfqOFb3UcvP6g1';

    if (!isAdmin) {
      console.warn(`[Security] Unauthorized branding update attempt by: ${decodedToken.email}`);
      return NextResponse.json({ error: 'Not authorized to update site settings' }, { status: 403 });
    }

    const brandingData = await request.json();
    
    // Remove ID if present to avoid document pollution
    const { id, ...dataToSave } = brandingData;

    await adminDb.collection('site_settings').doc('main').set(dataToSave, { merge: true });

    console.log(`[Success] Branding registry updated by ${decodedToken.email}`);
    return NextResponse.json({ success: true, message: 'Registry Synchronized' }, { status: 200 });
  } catch (error: any) {
    console.error('[API] Branding Update Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
