// ═══════════════════════════════════════════════════════
//  BILLING — Trial + Subscription
// ═══════════════════════════════════════════════════════

const TRIAL_DAYS  = 7
const FREE_LIMIT  = 4
let _billingProfile = null
let _trialBannerDismissed = false  // reset à chaque chargement de page

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
    // Feedback immédiat sur tous les boutons Stripe
    const modalBtn  = document.getElementById('upgradeCheckoutBtn')
    const bannerBtn = document.querySelector('.trial-banner-btn')
    if (modalBtn)  { modalBtn.disabled = true; modalBtn.textContent = '⏳ Connexion à Stripe…' }
    if (bannerBtn) {
        bannerBtn.disabled = true
        const lbl = bannerBtn.querySelector('.trial-btn-label')
        const spn = bannerBtn.querySelector('.trial-btn-spinner')
        if (lbl) lbl.style.display = 'none'
        if (spn) spn.style.display = ''
    }
    try {
        const { data, error: fnError } = await _db.functions.invoke('create-checkout', { body: {} })
        if (fnError) {
            let msg = fnError.message
            try {
                const text = await fnError.context?.text()
                console.error('[Billing] fn error body:', text)
                const j = text ? JSON.parse(text) : null
                msg = j?.error || j?.msg || msg
            } catch (e) {
                console.error('[Billing] fn error context:', fnError.context, e)
            }
            throw new Error(msg)
        }
        if (!data?.url) throw new Error('Réponse inattendue : ' + JSON.stringify(data))
        window.location.href = data.url
    } catch (err) {
        console.error('[Billing]', err)
        alert('Erreur paiement : ' + err.message)
        if (modalBtn)  { modalBtn.disabled = false; modalBtn.textContent = "S'abonner — 5 $/mois" }
        if (bannerBtn) {
            bannerBtn.disabled = false
            const lbl = bannerBtn.querySelector('.trial-btn-label')
            const spn = bannerBtn.querySelector('.trial-btn-spinner')
            if (lbl) lbl.style.display = ''
            if (spn) spn.style.display = 'none'
        }
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

function billingDismissBanner() {
    _trialBannerDismissed = true
    const banner = document.getElementById('trialBanner')
    if (banner) {
        banner.style.transition = 'opacity 0.2s'
        banner.style.opacity = '0'
        setTimeout(() => { banner.style.display = 'none'; banner.style.opacity = '' }, 200)
    }
}

function billingRenderTrialBanner() {
    const banner = document.getElementById('trialBanner')
    if (!banner) return
    if (!authUserId() || DB_OFFLINE || billingIsSubscribed() || _trialBannerDismissed) {
        banner.style.display = 'none'
        return
    }
    const days = billingTrialDaysLeft()
    if (days <= 0) {
        banner.style.display = 'none'
        return
    }
    banner.style.display = 'flex'
    const urgency = days <= 2 ? '🚨' : '⏳'
    banner.querySelector('.trial-banner-icon').textContent = urgency
    banner.querySelector('.trial-banner-text').textContent =
        days === 1 ? 'Dernier jour de votre essai gratuit!' : `Essai gratuit — ${days} jours restants.`
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
