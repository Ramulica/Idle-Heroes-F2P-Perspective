import { useState } from "react";
import { api } from "../api";
import HelpTip from "../components/HelpTip.jsx";
import { GUEST_KEY, GUEST_USER } from "../auth";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const action = mode === "register" ? api.register : api.login;
      const result = await action({ username, password });
      sessionStorage.removeItem(GUEST_KEY);
      onAuth(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function continueAsGuest() {
    sessionStorage.setItem(GUEST_KEY, "1");
    onAuth(GUEST_USER);
  }

  return (
    <div className="sky-page">
      <div className="shell auth-shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Idle Heroes F2P Perspective</h1>
              <HelpTip
                title="Account"
                steps={[
                  "Create account or log in with a username and password.",
                  "Usernames must be unique. If it is taken, log in or pick another.",
                  "Continue as guest to look around. Nothing is saved and you cannot rate.",
                ]}
              />
            </div>
            <p>Create an account to save your CSG calculator, cases, and ratings.</p>
          </div>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <div className="tabs">
            <button
              className={mode === "register" ? "gold-btn" : "tan-btn"}
              type="button"
              onClick={() => setMode("register")}
            >
              Create account
            </button>
            <button
              className={mode === "login" ? "gold-btn" : "tan-btn"}
              type="button"
              onClick={() => setMode("login")}
            >
              Log in
            </button>
          </div>
          <label className="field">
            <span>Username</span>
            <input
              className="cell-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              minLength={3}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              className="cell-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              minLength={4}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="gold-btn" type="submit" disabled={busy}>
            {busy
              ? "Please wait..."
              : mode === "register"
                ? "Create account"
                : "Log in"}
          </button>
          <button
            className="tan-btn"
            type="button"
            disabled={busy}
            onClick={continueAsGuest}
          >
            Continue as guest
          </button>
          <p className="muted" style={{ margin: 0 }}>
            Guest mode does not save data and cannot rate.
          </p>
        </form>
      </div>
    </div>
  );
}
