import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wppflnpsomudmrxervkm.supabase.co';
// A chave anônima (anon key) é segura para ser exposta em um ambiente de navegador.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcGZsbnBzb211ZG1yeGVydmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjc3NTEsImV4cCI6MjA3ODgwMzc1MX0.-3c1KVByyjjjvjuIoP015EcOGKtdaJ0ssJloOt1Jlzw';

export const supabase = createClient(supabaseUrl, supabaseKey);
