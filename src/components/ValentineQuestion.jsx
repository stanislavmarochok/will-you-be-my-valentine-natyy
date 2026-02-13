import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function ValentineQuestion({ onYes }) {
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const noButtonRef = useRef(null);
  const containerRef = useRef(null);
  const kittenSizesRef = useRef(null);
  const kittenVelocitiesRef = useRef(null);
  const kittenPositionsRef = useRef(null);

  // Cursor position for magnet kittens
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Kitten magnet initial layout (percent positions) - spread all over the page
  const initialKittens = [
    // Top-left area
    { id: 0, left: 2, top: 5, depth: 1 },
    { id: 1, left: 12, top: 2, depth: 0.9 },
    { id: 2, left: 18, top: 18, depth: 1.2 },
    
    // Top-center area
    { id: 3, left: 35, top: 8, depth: 1.1 },
    { id: 4, left: 52, top: 12, depth: 1 },
    { id: 5, left: 65, top: 5, depth: 0.85 },
    
    // Top-right area
    { id: 6, left: 82, top: 10, depth: 0.95 },
    { id: 7, left: 92, top: 2, depth: 1.1 },
    { id: 8, left: 98, top: 20, depth: 1.3 },
    
    // Middle-left area
    { id: 9, left: 5, top: 35, depth: 1.15 },
    { id: 10, left: 8, top: 55, depth: 1.2 },
    { id: 11, left: 3, top: 75, depth: 1.05 },
    
    // Middle-center area
    { id: 12, left: 30, top: 38, depth: 1.25 },
    { id: 13, left: 46, top: 50, depth: 1.1 },
    { id: 14, left: 66, top: 42, depth: 0.9 },
    
    // Middle-right area
    { id: 15, left: 88, top: 45, depth: 1.3 },
    { id: 16, left: 95, top: 60, depth: 0.95 },
    { id: 17, left: 98, top: 78, depth: 1.2 },
    
    // Bottom-left area
    { id: 18, left: 10, top: 88, depth: 1.1 },
    { id: 19, left: 22, top: 92, depth: 1.3 },
    
    // Bottom-center area
    { id: 20, left: 45, top: 88, depth: 1.05 },
    { id: 21, left: 58, top: 95, depth: 1.15 },
    
    // Bottom-right area
    { id: 22, left: 75, top: 85, depth: 0.9 },
    { id: 23, left: 88, top: 92, depth: 1.25 },
  ];
  
  // Initialize random sizes (only once)
  if (!kittenSizesRef.current) {
    kittenSizesRef.current = initialKittens.map(() => 
      Math.floor(Math.random() * 20) + 24 // Random size between 24-44px
    );
  }

  const kittenSizes = kittenSizesRef.current;

  // Initialize kitten velocities and positions (only once)
  if (!kittenVelocitiesRef.current) {
    kittenVelocitiesRef.current = initialKittens.map(() => ({
      vx: (Math.random() - 0.5) * 2, // Random velocity between -1 and 1
      vy: (Math.random() - 0.5) * 2,
    }));
    kittenPositionsRef.current = initialKittens.map(k => ({
      x: (k.left / 100) * window.innerWidth,
      y: (k.top / 100) * window.innerHeight,
    }));
  }

  // Dynamic offsets applied to each kitten (px)
  const [kittenOffsets, setKittenOffsets] = useState(
    new Array(24).fill(null).map(() => ({ x: 0, y: 0 }))
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNoHover = (e) => {
    const button = noButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Get cursor position
    const cursorX = e.clientX;
    const cursorY = e.clientY;

    // Calculate direction away from cursor
    const angle = Math.atan2(centerY - cursorY, centerX - cursorX);
    const distance = 150;

    const newX = Math.cos(angle) * distance;
    const newY = Math.sin(angle) * distance;

    setNoButtonPos({ x: newX, y: newY });
  };

  const handleMouseMove = (e) => {
    const button = noButtonRef.current;
    if (!button) return;
    // update cursor for kittens
    setCursorPos({ x: e.clientX, y: e.clientY });

    const rect = button.getBoundingClientRect();
    const distance = Math.hypot(
      e.clientX - (rect.left + rect.width / 2),
      e.clientY - (rect.top + rect.height / 2)
    );

    // If cursor is too close, make the button flee
    if (distance < 150) {
      handleNoHover(e);
    }
  };

  // Animation loop for kitten magnets (lerp smoothing)
  useEffect(() => {
    let raf = null;
    const lerp = (a, b, t) => a + (b - a) * t;

    const step = () => {
      const container = containerRef.current;
      if (!container) {
        raf = requestAnimationFrame(step);
        return;
      }

      const rect = container.getBoundingClientRect();

      const newOffsets = kittenOffsets.map((off, idx) => {
        const k = initialKittens[idx];
        const kittyX = rect.left + (k.left / 100) * rect.width;
        const kittyY = rect.top + (k.top / 100) * rect.height;

        const vx = cursorPos.x - kittyX;
        const vy = cursorPos.y - kittyY;
        const dist = Math.hypot(vx, vy);

        // attraction falls off with distance
        const maxDist = 600; // px - increased range
        const strength = Math.max(0, (maxDist - dist) / maxDist);

        // depth influences how strongly each kitten is pulled
        const pull = 60 * strength * (1 / k.depth); // increased force from 18 to 60

        const targetX = vx * (pull / (dist + 0.001));
        const targetY = vy * (pull / (dist + 0.001));

        // smooth the motion
        const smoothT = 0.12;
        return {
          x: lerp(off.x, targetX, smoothT),
          y: lerp(off.y, targetY, smoothT),
        };
      });

      setKittenOffsets(newOffsets);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorPos]);

  return (
    <div className="valentine-question-container" onMouseMove={handleMouseMove} ref={containerRef}>
      {/* Magnetic Kitten Emojis - Background */}
      {initialKittens.map((kitten, idx) => (
        <motion.div
          key={`kitten-${kitten.id}`}
          className="magnetic-kitten"
          style={{
            position: "absolute",
            left: `${kitten.left}%`,
            top: `${kitten.top}%`,
            fontSize: `${kittenSizes[idx]}px`,
            cursor: "pointer",
            userSelect: "none",
            transform: `translate(${kittenOffsets[idx]?.x || 0}px, ${kittenOffsets[idx]?.y || 0}px)`,
            transition: "transform 0.05s linear",
            zIndex: 1,
          }}
        >
          😻
        </motion.div>
      ))}

      <motion.div
        className="valentine-question-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        style={{ zIndex: 100 }}
      >
        {/* Floating Hearts */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={`heart-float-${i}`}
            className="floating-heart-static"
            style={{
              left: `${20 + i * 18}%`,
              top: `${10 + (i % 2) * 15}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            ❤️
          </motion.div>
        ))}

        <motion.h1
          className="valentine-question-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Will you be my
          <br />
          <span>Valentine?</span>
        </motion.h1>

        <motion.p
          className="valentine-question-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Let me show you something special... 💝
        </motion.p>

        <motion.div
          className="valentine-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            className="yes-button"
            onClick={onYes}
            onMouseEnter={(e) =>
              e.currentTarget.style.transform = "scale(1.1)"
            }
            onMouseLeave={(e) =>
              e.currentTarget.style.transform = "scale(1)"
            }
          >
            YES 💕
          </button>

          {!isMobile ? (
            <motion.button
              ref={noButtonRef}
              className="no-button"
              animate={{
                x: noButtonPos.x,
                y: noButtonPos.y,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 10,
              }}
            >
              NO 😢
            </motion.button>
          ) : (
            <button className="locked-button" disabled>
              🔐 Can't say NO yet
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
