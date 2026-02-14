import { useState } from "react";
import { motion } from "framer-motion";
import "../styles/auth.css";

const ALLOWED_USERNAME = "Natália Kuľková";
const CORRECT_PASSWORD = "4617";

export default function AuthGate({ onSuccess, onBack }) {
  const [username, setUsername] = useState(ALLOWED_USERNAME);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username !== ALLOWED_USERNAME) {
      setError("Hmm... toto miesto nie je pre teba 💌");
      return;
    }

    if (password !== CORRECT_PASSWORD) {
      setError("Ešte nie... spočítaj jej narodeniny s tvojimi 💕");
      return;
    }

    onSuccess();
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-content"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.button
          type="button"
          className="auth-back-btn"
          onClick={onBack}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Späť"
        >
          ←
        </motion.button>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Vaše meno"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="password-field">
            <input
              type="password"
              placeholder="Heslo je súčet jej narodenín a tvojich narodenín..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="password-hint">💡 Hint: spočítaj narodeninové čísla (Nata ddmm + Stano ddmm)</span>
          </div>

          <button type="submit" className="auth-submit-btn">
            Odomknúť 🔐
          </button>

          {error && <p className="error">{error}</p>}
        </form>
      </motion.div>
    </div>
  );
}
