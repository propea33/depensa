// ═══════════════════════════════════════════════════════
//  DB — Couche données Supabase + mode offline
//
//  • Mode OFFLINE : automatique sur file:/// (local)
//    → données en mémoire, aucun appel réseau
//  • Mode CLOUD   : sur Sevalla (https://)
//    → données stockées dans Supabase PostgreSQL
//    → filtrées par user_id (auth.uid())
// ═══════════════════════════════════════════════════════

const SUPABASE_URL      = 'https://wmgrztzkgbrquaadwgjb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ3J6dHprZ2JycXVhYWR3Z2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NzgyMjUsImV4cCI6MjA5MDE1NDIyNX0.FhauKqMs2E9c5dgnGiabdTdhyFg1hCewv0skI6J3T2g';

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
    console.log('[DB] Mode cloud initialisé');
}

// ── Bootstrap : charge les données au démarrage ───────────────────────────────

async function dbBootstrap() {
    if (DB_OFFLINE || !_db) return null;
    const uid = authUserId();
    if (!uid) return null;

    try {
        const { data, error } = await _db
            .from('expenses')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: true });

        if (error) throw error;

        console.log('[DB] Chargé —', data.length, 'dépenses');
        return data.map(_rowToExp);

    } catch (err) {
        console.warn('[DB] Bootstrap échoué:', err.message);
        return null;
    }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function dbInsertExpense(exp) {
    if (DB_OFFLINE || !_db) return;
    const uid = authUserId();
    if (!uid) return;
    try {
        const { data, error } = await _db
            .from('expenses')
            .insert(_expToRow(exp, uid))
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

// ── Insertion en lot (onboarding) ─────────────────────────────────────────────

async function dbInsertBulk(expList) {
    if (DB_OFFLINE || !_db) return null;
    const uid = authUserId();
    if (!uid) return null;
    try {
        const rows = expList.map(exp => _expToRow(exp, uid));
        const { data, error } = await _db
            .from('expenses')
            .insert(rows)
            .select('*');
        if (error) throw error;
        console.log('[DB] Bulk insert ✓', data.length, 'dépenses');
        return data.map(_rowToExp);
    } catch (err) {
        console.error('[DB] Bulk insert ✗:', err.message);
        return null;
    }
}

// ── Suppression de toutes les dépenses d'un utilisateur ──────────────────────

async function dbDeleteAllForUser() {
    if (DB_OFFLINE || !_db) return;
    const uid = authUserId();
    if (!uid) return;
    try {
        const { error } = await _db
            .from('expenses')
            .delete()
            .eq('user_id', uid);
        if (error) throw error;
        console.log('[DB] Toutes les dépenses supprimées pour l\'utilisateur');
    } catch (err) {
        console.error('[DB] Delete all ✗:', err.message);
    }
}

// ── Helpers privés ────────────────────────────────────────────────────────────

function _expToRow(exp, uid) {
    return {
        user_id:   uid || authUserId(),
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
