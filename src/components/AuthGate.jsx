import { useState } from "react";
import { motion } from "framer-motion";
import CuteCat from "./CuteCat";
import "../styles/auth.css";

const ALLOWED_USERNAME = "Natália Kuľková";
const CORRECT_PASSWORD = "Poprad";

export default function AuthGate({ onSuccess, goHome }) {
  const [username, setUsername] = useState(ALLOWED_USERNAME);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username !== ALLOWED_USERNAME) {
      setError("Hmm… this place isn't for you 💌");
      return;
    }

    if (password !== CORRECT_PASSWORD) {
      setError("Not quite… try remembering your boyfriend's secret city! 🏔️");
      return;
    }

    onSuccess();
  };

  const floatingHearts = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="auth-container">
      {/* Cute Cat Images */}
      <CuteCat position="top-right" />
      <CuteCat position="bottom-left" />

      {/* Emoji Decorations */}
      <div className="emoji-deco emoji-top-left">💕 🐱 💖</div>
      <div className="emoji-deco emoji-top-right">💗 😻 ✨</div>
      <div className="emoji-deco emoji-bottom-right">💝 🎀 💑</div>

      {/* Floating Hearts Background */}
      {floatingHearts.map((i) => (
        <motion.div
          key={`heart-${i}`}
          className="floating-heart"
          initial={{ y: -50, x: Math.random() * 200 - 100, opacity: 0 }}
          animate={{
            y: window.innerHeight + 50,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            delay: i * 0.3,
            repeat: Infinity,
          }}
        >
          ❤️
        </motion.div>
      ))}

      {/* Back to Home Button */}
      <motion.button
        className="back-home-btn"
        onClick={goHome}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.1 }}
      >
        💕 Back Home
      </motion.button>

      <motion.div
        className="auth-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h1>For Your Eyes Only 💖</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="password-field">
            <input
              type="password"
              placeholder="Your boyfriend's secret identity password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="password-hint">💡 Slovak city</span>
          </div>

          <button type="submit">Unlock 🔓</button>

          {error && <p className="error">{error}</p>}
        </form>
      </motion.div>
    </div>
  );
}
