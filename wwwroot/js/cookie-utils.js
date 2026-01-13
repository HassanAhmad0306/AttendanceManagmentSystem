// Cookie & auth helpers
// Token is HttpOnly, so JS can't access it directly

function setCookie(name, value, days = 7) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
}

// Not saving user data in localStorage anymore - everything's server-side now
function setAuthData(token, role, userId, username, fullName = null) {
    // Clear old data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
}

// Returns empty - session check happens on server now
function getAuthData() {
    return {
        token: null,
        role: null,
        userId: null,
        username: null,
        fullName: null
    };
}

async function clearAuthData() {
    try {
        await fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {
        console.error("Logout API call failed", e);
    }

    // Keep theme & remembered username, clear everything else
    const theme = localStorage.getItem('theme');
    const rememberedUsername = localStorage.getItem('rememberedUsername');

    localStorage.clear();

    if (theme) localStorage.setItem('theme', theme);
    if (rememberedUsername) localStorage.setItem('rememberedUsername', rememberedUsername);
    deleteCookie('access_token');
    deleteCookie('auth_role');
}
