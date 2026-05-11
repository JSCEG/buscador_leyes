require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Faltan credenciales SUPABASE_URL / SUPABASE_KEY en .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanAll() {
    console.log('\n🗑️  Iniciando limpieza completa de la BD...\n');

    // 1. user_favorites
    const { error: e1, count: c1 } = await supabase
        .from('user_favorites')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    if (e1) console.error('❌ user_favorites:', e1.message);
    else console.log('✓ user_favorites limpiada');

    // 2. user_notes
    const { error: e2 } = await supabase
        .from('user_notes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    if (e2) console.error('❌ user_notes:', e2.message);
    else console.log('✓ user_notes limpiada');

    // 3. articulos (FK -> leyes, borrar primero)
    const { error: e3 } = await supabase
        .from('articulos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    if (e3) console.error('❌ articulos:', e3.message);
    else console.log('✓ articulos limpiada');

    // 4. temas (FK -> leyes)
    const { error: e4 } = await supabase
        .from('temas')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    if (e4) {
        if (e4.code === '42P01') console.log('ℹ️  temas: tabla no existe, se omite');
        else console.error('❌ temas:', e4.message);
    } else console.log('✓ temas limpiada');

    // 5. leyes (padre)
    const { error: e5 } = await supabase
        .from('leyes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    if (e5) console.error('❌ leyes:', e5.message);
    else console.log('✓ leyes limpiada');

    console.log('\n✅ Limpieza completa.\n');
}

cleanAll().catch(e => {
    console.error('Error fatal:', e);
    process.exit(1);
});
