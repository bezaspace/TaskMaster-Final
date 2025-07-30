import { getDb, getCurrentDbTimestamp, handleSupabaseError } from '../../../../../lib/db';
import { logActivity } from '../../../../../lib/activityLogger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getDb();
    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !note) {
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
    const supabase = getDb();
    const data = await request.json();
    const { title, content } = data;
    
    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), { status: 400 });
    }
    
    const currentTimestamp = getCurrentDbTimestamp();
    const { data: note, error } = await supabase
      .from('notes')
      .update({
        title,
        content,
        updated_at: currentTimestamp
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
      }
      handleSupabaseError(error, 'note update');
    }
    
    // Log the activity
    await logActivity(`Updated note: "${title}"`);
    
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
    const supabase = getDb();
    
    // Get note title before deletion for logging
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('title')
      .eq('id', id)
      .single();
      
    if (fetchError || !note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
    }
    
    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      handleSupabaseError(deleteError, 'note deletion');
    }
    
    // Log the activity
    await logActivity(`Deleted note: "${note.title}"`);
    
    return new Response(JSON.stringify({ message: 'Note deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('DELETE /api/notes/[id] error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}