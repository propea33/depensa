// ═══════════════════════════════════════════════════════
//  DB — Couche données Supabase + mode offline
//
//  • Mode OFFLINE : automatique sur file:/// (local)
//    → données en mémoire, aucun appel réseau
//  • Mode CLOUD   : sur Sevalla (https://)
//    → données stockées dans Supabase PostgreSQL
//
//  NOTE: device_id fixe jusqu'à l'implémentation de l'auth.
//  Sera remplacé par auth.uid() lors de l'étape onboarding.
// ═══════════════════════════════════════════════════════

const SUPABASE_URL      = 'https://wmgrztzkgbrquaadwgjb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ3J6dHprZ2JycXVhYWR3Z2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NzgyMjUsImV4cCI6MjA5MDE1NDIyNX0.FhauKqMs2E9c5dgnGiabdTdhyFg1hCewv0skI6J3T2g';

// ID fixe jusqu'à l'auth (localStorage non fiable sur certains CDN)
const DB_USER_ID = 'marco';

// Mode offline si on ouvre le fichier directement (file://)
const DB_OFFLINE = location.protocol === 'file:';

let _db = null;

// ── Initialisation ────────────────────────────────────────────────────────────

function dbInit() {
    if (DB_OFFLINE) {
        console.log('[DB] Mode offline — données en mémoire');
        return;
    }
    _db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[DB] Mode cloud · user:', DB_USER_ID);
}

// ── Bootstrap : charge les données au démarrage ───────────────────────────────

async function dbBootstrap() {
    if (DB_OFFLINE || !_db) return null;

    try {
        const { data, error } = await _db
            .from('expenses')
            .select('*')
            .eq('device_id', DB_USER_ID)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data.length === 0) {
            // Première utilisation : sauvegarder les données démo
            const seeded = await _dbSeedDefaults();
            if (!seeded || seeded.length === 0) {
                console.warn('[DB] Seed échoué — données par défaut');
                return null;
            }
            return seeded;
        }

        console.log('[DB] Chargé —', data.length, 'dépenses');
        return data.map(_rowToExp);

    } catch (err) {
        console.warn('[DB] Bootstrap échoué, mode offline:', err.message);
        return null;
    }
}

// ── Seed données démo (première connexion) ────────────────────────────────────

async function _dbSeedDefaults() {
    const rows = expenses.map(exp => _expToRow(exp));
    const { data, error } = await _db
        .from('expenses')
        .insert(rows)
        .select('*');
    if (error) {
        console.error('[DB] Seed échoué:', error.message);
        return null;
    }
    console.log('[DB] Seed réussi —', data.length, 'dépenses insérées');
    return data.map(_rowToExp);
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function dbInsertExpense(exp) {
    if (DB_OFFLINE || !_db) return;
    try {
        const { data, error } = await _db
            .from('expenses')
            .insert(_expToRow(exp))
            .select('id')
            .single();
        if (error) throw error;
        exp._dbId = data.id;
        console.log('[DB] Insert ✓', exp.name, '→ id', data.id);
    } catch (err) {
        console.error('[DB] Insert ✗', exp.name, ':', err.message);
    }
}

async function dbUpdateExpense(exp) {
    if (DB_OFFLINE || !_db || !exp._dbId) return;
    try {
        const { error } = await _db
            .from('expenses')
            .update({
                name:      exp.name,
                cat:       exp.cat,
                amount:    exp.amount,
                recurring: exp.recurring,
                type:      exp.type      || 'fixe',
                frequency: exp.frequency || 'mensuel',
                notes:     exp.notes     || '',
            })
            .eq('id', exp._dbId);
        if (error) throw error;
    } catch (err) {
        console.error('[DB] Update:', err.message);
    }
}

async function dbDeleteExpense(exp) {
    if (DB_OFFLINE || !_db || !exp._dbId) return;
    try {
        const { error } = await _db
            .from('expenses')
            .delete()
            .eq('id', exp._dbId);
        if (error) throw error;
    } catch (err) {
        console.error('[DB] Delete:', err.message);
    }
}

// ── Helpers privés ────────────────────────────────────────────────────────────

function _expToRow(exp) {
    return {
        device_id: DB_USER_ID,
        name:      exp.name,
        cat:       exp.cat,
        amount:    exp.amount,
        recurring: exp.recurring,
        type:      exp.type      || 'fixe',
        frequency: exp.frequency || 'mensuel',
        notes:     exp.notes     || '',
    };
}

function _rowToExp(row) {
    return {
        id:        row.id,
        _dbId:     row.id,
        name:      row.name,
        cat:       row.cat,
        amount:    parseFloat(row.amount),
        recurring: row.recurring,
        type:      row.type      || 'fixe',
        frequency: row.frequency || 'mensuel',
        notes:     row.notes     || '',
    };
}
