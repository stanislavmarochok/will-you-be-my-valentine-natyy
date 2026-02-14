import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function ValentineQuestion({ onYes }) {
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const noButtonRef = useRef(null);
  const noButtonPosRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    noButtonPosRef.current = noButtonPos;
  }, [noButtonPos]);

  const handleNoHover = (e) => {
    const button = noButtonRef.current;
    const container = containerRef.current;
    if (!button || !container) return;

    const rect = button.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const cursorX = e.clientX;
    const cursorY = e.clientY;

    const angle = Math.atan2(centerY - cursorY, centerX - cursorX);
    const distance = 200;
    const newX = Math.cos(angle) * distance;
    const newY = Math.sin(angle) * distance;

    const currentPos = noButtonPosRef.current;
    const targetCenterX = centerX + (newX - currentPos.x);
    const targetCenterY = centerY + (newY - currentPos.y);

    const safePadding = 12;
    const minCenterX = containerRect.left + rect.width / 2 + safePadding;
    const maxCenterX = containerRect.right - rect.width / 2 - safePadding;
    const minCenterY = containerRect.top + rect.height / 2 + safePadding;
    const maxCenterY = containerRect.bottom - rect.height / 2 - safePadding;

    const clampedCenterX = Math.max(minCenterX, Math.min(maxCenterX, targetCenterX));
    const clampedCenterY = Math.max(minCenterY, Math.min(maxCenterY, targetCenterY));

    setNoButtonPos({
      x: currentPos.x + (clampedCenterX - centerX),
      y: currentPos.y + (clampedCenterY - centerY),
    });
  };

  const handleMouseMove = (e) => {
    const button = noButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const distance = Math.hypot(
      e.clientX - (rect.left + rect.width / 2),
      e.clientY - (rect.top + rect.height / 2)
    );

    if (distance < 150) {
      handleNoHover(e);
    }
  };

  return (
    <div className="valentine-question-container" onMouseMove={handleMouseMove} ref={containerRef}>
      <motion.div
        className="valentine-question-content collision-obstacle"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        style={{ zIndex: 100 }}
      >
        <motion.h1
          className="valentine-question-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="valentine-name">Natália</span>
          <br />
          Budeš moja
          <br />
          <span>Valentínka?</span>
        </motion.h1>

        <motion.div
          className="valentine-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            className="yes-button"
            onClick={onYes}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {"ÁNO \uD83D\uDC95"}
          </button>

          {!isMobile ? (
            <motion.button
              ref={noButtonRef}
              className="no-button"
              animate={{ x: noButtonPos.x, y: noButtonPos.y }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {"NIE \uD83D\uDE22"}
            </motion.button>
          ) : (
            <button className="locked-button" disabled>
              {"\uD83D\uDD10 Zatiaľ nemôžeš povedať NIE"}
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
