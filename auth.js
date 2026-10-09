

const SUPABASE_URL = 'https://kclstclxuitwarvahzha.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TzGvEjQvkJBP1qIf4WCrUQ_vU8VZ6-U';


const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.nookDb = db; // chat.html uses the same connection

/* Called by the form in index.html. Always returns { ok: boolean, message: string } */
window.nookAuth = async function (mode, v) {
  try {
    if (mode === 'signup') {
      const username = v.username.toLowerCase();

      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return { ok: false, message: 'Username must be 3-20 characters: letters, numbers or underscore.' };
      }

      // 1. Is the username free?
      const check = await db.rpc('username_available', { u: username });
      if (check.error) return { ok: false, message: check.error.message };
      if (!check.data) return { ok: false, message: 'That username is taken. Try another one.' };

      // 2. Create the account. The database trigger saves name + username in "profiles".
      const { data, error } = await db.auth.signUp({
        email: v.email,
        password: v.password,
        options: { data: { full_name: v.fullname, username: username } }
      });
      if (error) return { ok: false, message: error.message };

      // If "Confirm email" is ON in Supabase, there is no session yet.
      if (!data.session) {
        return { ok: true, message: 'Account created. Check your email to confirm, then log in.' };
      }
      window.location.href = 'chat.html';
      return { ok: true, message: 'Account created. Opening your chats...' };
    }

    // Log in
    const { error } = await db.auth.signInWithPassword({ email: v.email, password: v.password });
    if (error) return { ok: false, message: 'Wrong email or password.' };

    window.location.href = 'chat.html';
    return { ok: true, message: 'Logged in. Opening your chats...' };

  } catch (err) {
    return { ok: false, message: 'Could not reach the server. Check your internet and keys.' };
  }
};