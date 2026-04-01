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
            // Fetch fresh user data (including latest user_metadata) from server
            const { data: { user } } = await _db.auth.getUser();
            _authUser = user || session.user;
            return session;
        }
        return null;
    } catch (e) {
        console.warn('[Auth] getSession échoué:', e.message);
        return null;
    }
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

async function authSignInWithGoogle() {
    if (DB_OFFLINE || !_db) return;
    const btn = document.getElementById('authGoogleBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Redirection…'; }
    const { error } = await _db.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/app' }
    });
    if (error) {
        console.error('[Auth] Google OAuth:', error.message);
        if (btn) { btn.disabled = false; btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continuer avec Google`; }
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
    if (!_db) throw new Error('Non connecté.');
    if (!_authUser) {
        await authGetSession();
        if (!_authUser) throw new Error('Session expirée. Reconnectez-vous.');
    }
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
