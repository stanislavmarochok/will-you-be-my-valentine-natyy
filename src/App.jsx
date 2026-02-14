import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ValentineQuestion from "./components/ValentineQuestion";
import AuthGate from "./components/AuthGate";
import MemoryMatchGame from "./components/MemoryMatchGame";
import CursorEmojiTrail from "./components/CursorEmojiTrail";

const PROGRESS_STAGE_KEY = "valentine-progress-stage";
const VALID_STAGES = new Set(["valentine", "auth", "game-1", "game-2"]);

function getInitialStage() {
  if (typeof window === "undefined") return "valentine";
  const saved = window.localStorage.getItem(PROGRESS_STAGE_KEY);
  return VALID_STAGES.has(saved) ? saved : "valentine";
}

function App() {
  const [stage, setStage] = useState(getInitialStage);

  useEffect(() => {
    window.localStorage.setItem(PROGRESS_STAGE_KEY, stage);
  }, [stage]);

  const goHome = () => {
    setStage("valentine");
  };

  return (
    <>
      <CursorEmojiTrail />
      <AnimatePresence mode="wait">
        {stage === "valentine" ? (
          <motion.div
            key="valentine"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.985 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            <ValentineQuestion onYes={() => setStage("auth")} />
          </motion.div>
        ) : stage === "auth" ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.985 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            <AuthGate onSuccess={() => setStage("game-1")} onBack={goHome} />
          </motion.div>
        ) : stage === "game-1" ? (
          <motion.div
            key="game-1"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.985 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            <MemoryMatchGame onBack={goHome} onDevNext={() => setStage("game-2")} />
          </motion.div>
        ) : (
          <motion.div
            key="game-2"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.985 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            <div className="auth-container">
              <div className="auth-content" style={{ textAlign: "center", paddingTop: "4rem" }}>
                <button type="button" className="auth-back-btn" onClick={() => setStage("game-1")}>
                  ←
                </button>
                <h2 style={{ color: "#d63456", marginBottom: "0.8rem" }}>Game 2 Placeholder</h2>
                <p style={{ color: "#6d4f61" }}>
                  Si na dalsom leveli. Posli zadanie na druhu hru a napojim to sem.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
