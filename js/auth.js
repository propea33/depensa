// ═══════════════════════════════════════════════════════
//  AUTH — Supabase Authentication
//  Dépend de db.js (variable _db doit être initialisée)
// ═══════════════════════════════════════════════════════

let _authUser = null;

// ── Session ───────────────────────────────────────────────────────────────────

async function authGetSession() {
    if (DB_OFFLINE || !_db) return null;
    try {
        const { data: { session } } = await _db.auth.getSession();
        if (session) {
            _authUser = session.user;
            return session;
        }
        return null;
    } catch (e) {
        console.warn('[Auth] getSession échoué:', e.message);
        return null;
    }
}

// ── Sign Up ───────────────────────────────────────────────────────────────────

async function authSignUp(email, password) {
    const { data, error } = await _db.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session) _authUser = data.user;
    return data;
}

// ── Sign In ───────────────────────────────────────────────────────────────────

async function authSignIn(email, password) {
    const { data, error } = await _db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    _authUser = data.user;
    return data;
}

// ── Sign Out ──────────────────────────────────────────────────────────────────

async function authSignOut() {
    if (_db) await _db.auth.signOut();
    _authUser = null;
}

// ── Accesseurs ────────────────────────────────────────────────────────────────

function authUserId() {
    return _authUser?.id || null;
}

function authUserFirstName() {
    return _authUser?.user_metadata?.first_name || null;
}

function authUserLastName() {
    return _authUser?.user_metadata?.last_name || null;
}

function authUserFullName() {
    const f = authUserFirstName() || '';
    const l = authUserLastName()  || '';
    return (f + (l ? ' ' + l : '')).trim() || null;
}

function authUserInitials() {
    const f = authUserFirstName() || '';
    const l = authUserLastName()  || '';
    return ((f[0] || '') + (l[0] || '')).toUpperCase() || '?';
}

function authUserEmail() {
    return _authUser?.email || null;
}

function authHasCompletedOnboarding() {
    return !!_authUser?.user_metadata?.onboarding_done;
}

// ── Sauvegarde métadonnées ────────────────────────────────────────────────────

async function authMarkOnboardingDone(firstName, lastName) {
    if (!_db || !_authUser) return;
    const metadata = { onboarding_done: true };
    if (firstName) metadata.first_name = firstName;
    if (lastName  !== undefined) metadata.last_name = lastName || '';
    const { data, error } = await _db.auth.updateUser({ data: metadata });
    if (!error && data?.user) _authUser = data.user;
}

async function authUpdateProfile(firstName, lastName) {
    if (!_db || !_authUser) return;
    const metadata = {};
    if (firstName !== undefined) metadata.first_name = firstName || '';
    if (lastName  !== undefined) metadata.last_name  = lastName  || '';
    const { data, error } = await _db.auth.updateUser({ data: metadata });
    if (error) throw error;
    if (data?.user) _authUser = data.user;
}

async function authUpdatePassword(newPassword) {
    if (!_db || !_authUser) return;
    const { error } = await _db.auth.updateUser({ password: newPassword });
    if (error) throw error;
}
