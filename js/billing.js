// ═══════════════════════════════════════════════════════
//  BILLING — Trial + Subscription
// ═══════════════════════════════════════════════════════

const TRIAL_DAYS  = 7
const FREE_LIMIT  = 4
let _billingProfile = null

// ── Chargement ────────────────────────────────────────

async function billingLoadProfile() {
    if (DB_OFFLINE || !_db || !authUserId()) return null
    const { data, error } = await _db
        .from('profiles')
        .select('trial_start_at, subscription_status, subscription_end_at')
        .eq('id', authUserId())
        .single()
    if (!error && data) _billingProfile = data
    return _billingProfile
}

// ── État ──────────────────────────────────────────────

function billingIsSubscribed() {
    return _billingProfile?.subscription_status === 'active'
}

function billingIsOnTrial() {
    if (!_billingProfile) return false
    if (billingIsSubscribed()) return false
    return billingTrialDaysLeft() > 0
}

function billingTrialDaysLeft() {
    if (!_billingProfile) return TRIAL_DAYS
    const end = new Date(_billingProfile.trial_start_at).getTime() + TRIAL_DAYS * 86400000
    return Math.max(0, Math.ceil((end - Date.now()) / 86400000))
}

function billingCanAddExpense() {
    if (DB_OFFLINE || !authUserId()) return true
    if (billingIsSubscribed() || billingIsOnTrial()) return true
    return expenses.length < FREE_LIMIT
}

// ── Checkout Stripe ───────────────────────────────────

async function billingCreateCheckout() {
    const btn = document.getElementById('upgradeCheckoutBtn')
    if (btn) { btn.disabled = true; btn.textContent = 'Redirection…' }
    try {
        const { data: { session } } = await _db.auth.getSession()
        const res = await fetch(
            'https://wmgrztzkgbrquaadwgjb.supabase.co/functions/v1/create-checkout',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
            }
        )
        const { url, error } = await res.json()
        if (error) throw new Error(error)
        window.location.href = url
    } catch (err) {
        console.error('[Billing]', err)
        if (btn) { btn.disabled = false; btn.textContent = "S'abonner — 5 $/mois" }
    }
}

// ── UI helpers ────────────────────────────────────────

function billingShowUpgradeModal() {
    const overlay = document.getElementById('upgradeOverlay')
    if (overlay) overlay.classList.add('open')
}

function billingHideUpgradeModal() {
    const overlay = document.getElementById('upgradeOverlay')
    if (overlay) overlay.classList.remove('open')
}

function billingRenderTrialBanner() {
    const banner = document.getElementById('trialBanner')
    if (!banner) return
    if (!authUserId() || DB_OFFLINE || billingIsSubscribed()) {
        banner.style.display = 'none'
        return
    }
    const days = billingTrialDaysLeft()
    if (days <= 0) {
        banner.style.display = 'none'
        return
    }
    banner.style.display = 'flex'
    banner.querySelector('.trial-banner-text').textContent =
        days === 1 ? 'Dernier jour de votre essai gratuit.' : `Essai gratuit — ${days} jours restants.`
}

// ── Gestion retour Stripe ─────────────────────────────

async function billingHandleReturn() {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') === 'true') {
        // Recharger le profil pour refléter l'abonnement actif
        await billingLoadProfile()
        billingRenderTrialBanner()
        // Nettoyer l'URL
        history.replaceState(null, '', '/app')
        // Confirmation
        showToast('Abonnement activé — bienvenue dans Depensa Pro ! 🎉')
    }
}
