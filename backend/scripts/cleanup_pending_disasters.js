// Script to delete disasters not approved within 7 days
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function cleanupPendingDisasters() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('disasters')
    .delete()
    .lt('created_at', sevenDaysAgo)
    .eq('status', 'pending');
  if (error) {
    console.error('Cleanup error:', error.message);
    process.exit(1);
  }
  console.log('Deleted pending disasters:', data?.length || 0);
}

cleanupPendingDisasters();
