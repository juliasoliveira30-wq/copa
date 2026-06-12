// Mercado da Copa - Authentication Module

let currentUser = null;

function initAuth() {
    if (isDemoMode()) {
        const stored = localStorage.getItem('mercadoCopa_user');
        if (stored) {
            try {
                currentUser = JSON.parse(stored);
            } catch (e) {
                currentUser = null;
            }
        }
    } else {
        const sb = getSupabase();
        sb.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email,
                    created_at: session.user.created_at
                };
            } else {
                currentUser = null;
            }
            updateAuthUI();
        });

        // Check current session
        sb.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user) {
                currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email,
                    created_at: session.user.created_at
                };
            }
            updateAuthUI();
        });
    }

    updateAuthUI();
    return currentUser;
}

async function signUp(email, password, name) {
    if (isDemoMode()) {
        // Check if a user already exists with that email
        const existing = localStorage.getItem('mercadoCopa_user');
        if (existing) {
            const parsed = JSON.parse(existing);
            if (parsed.email === email) {
                return { user: null, error: 'Já existe uma conta com este email.' };
            }
        }

        const user = {
            id: crypto.randomUUID(),
            email: email,
            name: name,
            created_at: new Date().toISOString()
        };

        localStorage.setItem('mercadoCopa_user', JSON.stringify(user));
        currentUser = user;
        updateAuthUI();
        return { user, error: null };
    } else {
        const sb = getSupabase();
        const { data, error } = await sb.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { name: name }
            }
        });

        if (error) {
            return { user: null, error: error.message };
        }

        const user = data.user ? {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || name,
            created_at: data.user.created_at
        } : null;

        currentUser = user;
        updateAuthUI();
        return { user, error: null };
    }
}

async function signIn(email, password) {
    if (isDemoMode()) {
        const stored = localStorage.getItem('mercadoCopa_user');
        if (!stored) {
            return { user: null, error: 'Nenhuma conta encontrada. Cadastre-se primeiro.' };
        }

        const parsed = JSON.parse(stored);
        if (parsed.email !== email) {
            return { user: null, error: 'Email ou senha incorretos.' };
        }

        currentUser = parsed;
        updateAuthUI();
        return { user: parsed, error: null };
    } else {
        const sb = getSupabase();
        const { data, error } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            return { user: null, error: error.message };
        }

        const user = data.user ? {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
            created_at: data.user.created_at
        } : null;

        currentUser = user;
        updateAuthUI();
        return { user, error: null };
    }
}

async function signOut() {
    if (isDemoMode()) {
        localStorage.removeItem('mercadoCopa_user');
        currentUser = null;
        updateAuthUI();
        return { error: null };
    } else {
        const sb = getSupabase();
        const { error } = await sb.auth.signOut();
        if (!error) {
            currentUser = null;
        }
        updateAuthUI();
        return { error: error ? error.message : null };
    }
}

function getUser() {
    return currentUser;
}

function isLoggedIn() {
    return !!currentUser;
}

function updateAuthUI() {
    // Show/hide elements based on auth state
    const loggedInElements = document.querySelectorAll('[data-auth-logged-in]');
    const loggedOutElements = document.querySelectorAll('[data-auth-logged-out]');

    loggedInElements.forEach(el => {
        el.style.display = isLoggedIn() ? '' : 'none';
    });

    loggedOutElements.forEach(el => {
        el.style.display = isLoggedIn() ? 'none' : '';
    });

    // Update profile info if elements exist
    if (currentUser) {
        const nameEl = document.querySelector('.profile-name');
        if (nameEl) nameEl.textContent = currentUser.name;

        const emailEl = document.querySelector('.profile-email');
        if (emailEl) emailEl.textContent = currentUser.email;

        const avatarEl = document.querySelector('.profile-avatar');
        if (avatarEl) {
            const initials = currentUser.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            avatarEl.textContent = initials;
        }

        const navUserName = document.querySelector('.nav-user-name');
        if (navUserName) navUserName.textContent = currentUser.name;
    }
}
