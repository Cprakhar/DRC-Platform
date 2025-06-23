import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function cleanupPendingDisasters() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('disasters')
    .delete()
    .match({ status: 'pending' })
    .lt('created_at', sevenDaysAgo) as { data: any[] | null, error: any };

  if (error) {
    console.error('Error deleting old pending disasters:', error);
    throw error;
  }
  const deletedCount = Array.isArray(data) ? data.length : 0;
  console.log(`Deleted ${deletedCount} pending disasters older than 7 days.`);
  return deletedCount;
}

// Only run as script if called directly
if (require.main === module) {
  cleanupPendingDisasters().then(() => process.exit(0));
}
