/**
 * PG SAHARA - Authentication & Profile Manager
 * Handles User Registration, Login, Session State, and Password Reset with Resend Option.
 */

const AUTH_USERS_KEY = 'pg_sahara_users_v1';
const AUTH_SESSION_KEY = 'pg_sahara_session_v1';
const AUTH_RESET_CODES_KEY = 'pg_sahara_reset_codes_v1';

class SaharaAuth {
  constructor() {
    this.initUsers();
    this.currentUser = this.loadSession();
  }

  initUsers() {
    let users = this.getUsers();
    if (!users || Object.keys(users).length === 0) {
      // Default demo college student account
      users = {
        'student@pgsahara.com': {
          id: 'usr_student_demo',
          name: 'Rajbir',
          email: 'student@pgsahara.com',
          passwordHash: this.hashPassword('sahara123'),
          pgName: 'PG Sahara (Room #204)',
          college: 'Engineering College',
          createdAt: new Date().toISOString()
        }
      };
      this.saveUsers(users);
    }
  }

  getUsers() {
    try {
      const stored = localStorage.getItem(AUTH_USERS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  saveUsers(users) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  }

  hashPassword(password) {
    // Simple fast client-side obfuscation hash for demo & localStorage safety
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash) + '_' + password.length;
  }

  loadSession() {
    try {
      const session = localStorage.getItem(AUTH_SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        const users = this.getUsers();
        if (users[parsed.email]) {
          return users[parsed.email];
        }
      }
    } catch (e) {}
    // Default fallback: logged in with demo student for seamless experience
    const users = this.getUsers();
    return users['student@pgsahara.com'] || null;
  }

  saveSession(user) {
    if (user) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ email: user.email, id: user.id }));
      this.currentUser = user;
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
      this.currentUser = null;
    }
  }

  // --- Registration ---
  register(name, email, password, pgName = '', college = '') {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !name.trim() || !password) {
      throw new Error('Please fill in all required fields.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const users = this.getUsers();
    if (users[cleanEmail]) {
      throw new Error('An account with this email already exists. Please login or reset your password.');
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash: this.hashPassword(password),
      pgName: pgName.trim() || 'PG Sahara',
      college: college.trim() || 'College Student',
      createdAt: new Date().toISOString()
    };

    users[cleanEmail] = newUser;
    this.saveUsers(users);
    this.saveSession(newUser);
    return newUser;
  }

  // --- Login ---
  login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const user = users[cleanEmail];

    if (!user) {
      throw new Error('No account found with this email address.');
    }

    if (user.passwordHash !== this.hashPassword(password)) {
      throw new Error('Incorrect password. Please try again or use the reset option.');
    }

    this.saveSession(user);
    return user;
  }

  // --- Logout ---
  logout() {
    this.saveSession(null);
    return true;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // --- Password Reset & Resend Option ---
  sendResetCode(email) {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    if (!users[cleanEmail]) {
      throw new Error('No account found with this email address.');
    }

    // Generate simulated 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes validity

    const resetData = {
      email: cleanEmail,
      code: code,
      expiresAt: expiresAt,
      sentAt: Date.now()
    };

    localStorage.setItem(AUTH_RESET_CODES_KEY, JSON.stringify(resetData));
    return {
      email: cleanEmail,
      code: code, // returned for demonstration / UI helper alert
      expiresInMinutes: 15
    };
  }

  verifyAndResetPassword(email, code, newPassword) {
    const cleanEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    let storedReset = null;
    try {
      const stored = localStorage.getItem(AUTH_RESET_CODES_KEY);
      if (stored) storedReset = JSON.parse(stored);
    } catch (e) {}

    if (!storedReset || storedReset.email !== cleanEmail) {
      throw new Error('No password reset requested for this email. Please request a reset code first.');
    }

    if (Date.now() > storedReset.expiresAt) {
      throw new Error('Reset code has expired. Please use the Resend Code option to get a new code.');
    }

    if (storedReset.code !== code.trim()) {
      throw new Error('Invalid reset code entered. Please check or click Resend Code.');
    }

    // Update user's password
    const users = this.getUsers();
    if (!users[cleanEmail]) {
      throw new Error('User not found.');
    }

    users[cleanEmail].passwordHash = this.hashPassword(newPassword);
    this.saveUsers(users);

    // Clear reset token
    localStorage.removeItem(AUTH_RESET_CODES_KEY);
    return true;
  }
}

window.saharaAuth = new SaharaAuth();
