import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Remove the session cookie
    cookies().delete('session');
    
    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
