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

function authHasCompletedOnboarding() {
    return !!_authUser?.user_metadata?.onboarding_done;
}

// ── Sauvegarde métadonnées ────────────────────────────────────────────────────

async function authMarkOnboardingDone(firstName) {
    if (!_db || !_authUser) return;
    const metadata = { onboarding_done: true };
    if (firstName) metadata.first_name = firstName;
    const { data, error } = await _db.auth.updateUser({ data: metadata });
    if (!error && data?.user) _authUser = data.user;
}
