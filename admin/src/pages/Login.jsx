import { useState } from 'react';
import { api, token, isTelegram } from '../lib/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.login(username, password);
      token.set(r.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <img src="/logo.png" alt="IPPO" className="login-logo" />
        <h1>Admin panel</h1>
        {isTelegram && <p className="hint">Telegram orqali kirish uchun botda <code>/admin PAROL</code> yozing yoki login bilan kiring.</p>}
        <label>
          Login
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label>
          Parol
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn primary block" disabled={busy || !password}>
          {busy ? 'Kirilmoqda…' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
