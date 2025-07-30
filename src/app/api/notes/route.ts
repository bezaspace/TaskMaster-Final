import { getDb, getCurrentDbTimestamp, handleSupabaseError } from '../../../../lib/db';
import { logActivity } from '../../../../lib/activityLogger';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      handleSupabaseError(error, 'notes fetch');
    }
    
    return new Response(JSON.stringify(notes || []), {
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
    const supabase = getDb();
    const data = await request.json();
    const { title, content } = data;
    
    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), { status: 400 });
    }
    
    const currentTimestamp = getCurrentDbTimestamp();
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        title,
        content,
        created_at: currentTimestamp,
        updated_at: currentTimestamp
      })
      .select()
      .single();
    
    if (error) {
      handleSupabaseError(error, 'note creation');
    }
    
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