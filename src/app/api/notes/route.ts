import { getDb, getCurrentDbTimestamp } from '../../../../lib/db';
import { logActivity } from '../../../../lib/activityLogger';

export async function GET() {
  try {
    const db = await getDb();
    const notes = await db.all('SELECT * FROM notes ORDER BY updated_at DESC');
    
    return new Response(JSON.stringify(notes), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('GET /api/notes error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const data = await request.json();
    const { title, content } = data;
    
    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), { status: 400 });
    }
    
    const currentTimestamp = getCurrentDbTimestamp();
    const result = await db.run(
      'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
      title,
      content,
      currentTimestamp,
      currentTimestamp
    );
    
    const note = await db.get('SELECT * FROM notes WHERE id = ?', result.lastID);
    
    // Log the activity
    await logActivity(`Created note: "${title}"`);
    
    return new Response(JSON.stringify(note), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (err: any) {
    console.error('POST /api/notes error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}