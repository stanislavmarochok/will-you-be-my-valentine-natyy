import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function CuteCat({ position = "random" }) {
  const [catPos, setCatPos] = useState({ 
    x: Math.random() * (window.innerWidth - 150), 
    y: Math.random() * (window.innerHeight - 150) 
  });
  const [catImage, setCatImage] = useState("");
  const [rotation, setRotation] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const velocityRef = useRef({ 
    x: (Math.random() - 0.5) * 4, 
    y: (Math.random() - 0.5) * 4 
  });
  const rotationVelocityRef = useRef((Math.random() - 0.5) * 3);

  // Get random cat image on mount
  useEffect(() => {
    const randomId = Math.random().toString(36).substring(7);
    setCatImage(`https://cataas.com/cat?timestamp=${Date.now()}-${randomId}`);
  }, []);

  // Track mouse movement for magnet effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Continuous movement with bouncing and rotation
  useEffect(() => {
    const animationFrame = setInterval(() => {
      setCatPos((prevPos) => {
        const catWidth = 150;
        const catHeight = 150;
        const padding = 10;

        // Boundaries - within window limits
        const maxX = window.innerWidth - catWidth - padding;
        const maxY = window.innerHeight - catHeight - padding;
        const minX = padding;
        const minY = padding;

        let newX = prevPos.x + velocityRef.current.x;
        let newY = prevPos.y + velocityRef.current.y;

        // Bounce off walls
        if (newX <= minX) {
          velocityRef.current.x = Math.abs(velocityRef.current.x);
          newX = minX;
        }
        if (newX >= maxX) {
          velocityRef.current.x = -Math.abs(velocityRef.current.x);
          newX = maxX;
        }

        if (newY <= minY) {
          velocityRef.current.y = Math.abs(velocityRef.current.y);
          newY = minY;
        }
        if (newY >= maxY) {
          velocityRef.current.y = -Math.abs(velocityRef.current.y);
          newY = maxY;
        }

        // Magnet effect - gentle pull toward cursor
        const catCenterX = newX + catWidth / 2;
        const catCenterY = newY + catHeight / 2;
        const distX = cursorPos.x - catCenterX;
        const distY = cursorPos.y - catCenterY;
        const distance = Math.hypot(distX, distY);

        if (distance < 300 && distance > 0) {
          const pullStrength = 0.005;
          velocityRef.current.x += (distX / distance) * pullStrength;
          velocityRef.current.y += (distY / distance) * pullStrength;
        }

        // Limit max velocity
        const maxVel = 4;
        if (Math.abs(velocityRef.current.x) > maxVel) {
          velocityRef.current.x = Math.sign(velocityRef.current.x) * maxVel;
        }
        if (Math.abs(velocityRef.current.y) > maxVel) {
          velocityRef.current.y = Math.sign(velocityRef.current.y) * maxVel;
        }

        return { x: newX, y: newY };
      });

      // Update rotation continuously
      setRotation((prev) => prev + rotationVelocityRef.current);
    }, 16); // ~60 FPS

    return () => clearInterval(animationFrame);
  }, [cursorPos]);

  return (
    <motion.div
      className="cute-cat"
      style={{
        left: `${catPos.x}px`,
        top: `${catPos.y}px`,
        position: "fixed",
        zIndex: 4,
        pointerEvents: "none",
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ type: "linear" }}
        style={{ width: "150px", height: "150px" }}
      >
        <img 
          src={catImage} 
          alt="Cute cat"
          style={{ width: "100%", height: "100%", borderRadius: "20px", objectFit: "cover" }}
        />
      </motion.div>
    </motion.div>
  );
}
