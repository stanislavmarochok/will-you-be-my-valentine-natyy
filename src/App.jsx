import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ValentineQuestion from "./components/ValentineQuestion";
import AuthGate from "./components/AuthGate";
import CursorEmojiTrail from "./components/CursorEmojiTrail";

function App() {
  const [stage, setStage] = useState("valentine");

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
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.985 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            <AuthGate onSuccess={goHome} onBack={goHome} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
