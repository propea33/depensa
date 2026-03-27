// ═══════════════════════════════════════════════════════
//  DB — Couche données Supabase + mode offline
//
//  • Mode OFFLINE : automatique sur file:/// (local)
//    → données en mémoire, aucun appel réseau
//  • Mode CLOUD   : sur Sevalla (https://)
//    → données stockées dans Supabase PostgreSQL
// ═══════════════════════════════════════════════════════

const SUPABASE_URL      = 'https://wmgrztzkgbrquaadwgjb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ3J6dHprZ2JycXVhYWR3Z2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NzgyMjUsImV4cCI6MjA5MDE1NDIyNX0.FhauKqMs2E9c5dgnGiabdTdhyFg1hCewv0skI6J3T2g';

// Mode offline si on ouvre le fichier directement (file://)
const DB_OFFLINE = location.protocol === 'file:';

let _db       = null;
let _deviceId = null;

// ── Initialisation ────────────────────────────────────────────────────────────

function dbInit() {
    if (DB_OFFLINE) {
        console.log('[DB] Mode offline — données en mémoire');
        return;
    }

    _db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Identifiant unique par appareil (sera remplacé par auth.uid() lors de l'onboarding)
    _deviceId = localStorage.getItem('depensa_device');
    if (!_deviceId) {
        _deviceId = 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
        localStorage.setItem('depensa_device', _deviceId);
    }

    console.log('[DB] Mode cloud · device:', _deviceId.slice(0, 12) + '…');
}

// ── Bootstrap : charge les données au démarrage ───────────────────────────────
// Retourne null → utiliser les données JS par défaut (offline ou erreur)
// Retourne []   → première utilisation, seed automatique
// Retourne [...] → données de l'utilisateur

async function dbBootstrap() {
    if (DB_OFFLINE || !_db) return null;

    try {
        const { data, error } = await _db
            .from('expenses')
            .select('*')
            .eq('device_id', _deviceId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data.length === 0) {
            // Première utilisation : sauvegarder les données démo dans la DB
            const seeded = await _dbSeedDefaults();
            if (!seeded || seeded.length === 0) {
                console.warn('[DB] Seed vide ou échoué — utilisation données par défaut');
                return null;
            }
            return seeded;
        }

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
    console.log('[DB] Insert →', exp.name);
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
        device_id: _deviceId,
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
        id:        row.id,           // DB bigserial = JS id
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
