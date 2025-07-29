import { getDb, getCurrentDbTimestamp } from '../../../../../lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const note = await db.get('SELECT * FROM notes WHERE id = ?', id);
    
    if (!note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify(note), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('GET /api/notes/[id] error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const data = await request.json();
    const { title, content } = data;
    
    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), { status: 400 });
    }
    
    const currentTimestamp = getCurrentDbTimestamp();
    const result = await db.run(
      'UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?',
      title,
      content,
      currentTimestamp,
      id
    );
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
    }
    
    const note = await db.get('SELECT * FROM notes WHERE id = ?', id);
    return new Response(JSON.stringify(note), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('PUT /api/notes/[id] error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.run('DELETE FROM notes WHERE id = ?', id);
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ message: 'Note deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('DELETE /api/notes/[id] error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}