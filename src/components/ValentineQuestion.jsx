import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function ValentineQuestion({ onYes }) {
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const noButtonRef = useRef(null);
  const containerRef = useRef(null);
  const kittenSizesRef = useRef([]);
  const kittenVelocitiesRef = useRef([]);
  const kittenAngularVelocitiesRef = useRef([]);
  const kittenPositionsRef = useRef([]);
  const cursorRef = useRef({ x: 0, y: 0, active: false, vx: 0, vy: 0, lastTs: 0 });
  const cursorHeadingRef = useRef({ x: 0, y: -1 });
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);

  const initialKittens = Array.from({ length: 150 }, (_, i) => {
    const columns = 12;
    const rows = 9;
    const col = i % columns;
    const row = Math.floor(i / columns);
    return {
      id: i,
      left: 4 + (col * 92) / (columns - 1),
      top: 5 + (row * 90) / (rows - 1),
    };
  });

  if (kittenSizesRef.current.length === 0) {
    kittenSizesRef.current = initialKittens.map(() => Math.floor(Math.random() * 20) + 24);
  }

  const kittenSizes = kittenSizesRef.current;
  const [kittenPositions, setKittenPositions] = useState(
    initialKittens.map(() => ({ x: 0, y: 0, angle: 0 }))
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getObstacleRects = (containerRect) => {
    const container = containerRef.current;
    if (!container) return [];

    const padding = 8;
    return Array.from(container.querySelectorAll(".collision-obstacle")).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left - containerRect.left - padding,
        top: rect.top - containerRect.top - padding,
        right: rect.right - containerRect.left + padding,
        bottom: rect.bottom - containerRect.top + padding,
      };
    });
  };

  const resolveCircleRectCollision = (position, velocity, radius, rect) => {
    const closestX = Math.max(rect.left, Math.min(position.x, rect.right));
    const closestY = Math.max(rect.top, Math.min(position.y, rect.bottom));
    const dx = position.x - closestX;
    const dy = position.y - closestY;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq >= radius * radius) return false;

    let nx = dx;
    let ny = dy;
    let distance = Math.sqrt(distanceSq);

    if (distance < 0.001) {
      const distancesToSides = [
        Math.abs(position.x - rect.left),
        Math.abs(position.x - rect.right),
        Math.abs(position.y - rect.top),
        Math.abs(position.y - rect.bottom),
      ];
      const minDistance = Math.min(...distancesToSides);
      if (minDistance === distancesToSides[0]) {
        nx = -1;
        ny = 0;
      } else if (minDistance === distancesToSides[1]) {
        nx = 1;
        ny = 0;
      } else if (minDistance === distancesToSides[2]) {
        nx = 0;
        ny = -1;
      } else {
        nx = 0;
        ny = 1;
      }
      distance = 1;
    } else {
      nx /= distance;
      ny /= distance;
    }

    const penetration = radius - distance + 0.5;
    position.x += nx * penetration;
    position.y += ny * penetration;

    const dot = velocity.vx * nx + velocity.vy * ny;
    if (dot < 0) {
      velocity.vx -= 2 * dot * nx;
      velocity.vy -= 2 * dot * ny;
    }

    return true;
  };

  const handleNoHover = (e) => {
    const button = noButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const cursorX = e.clientX;
    const cursorY = e.clientY;

    const angle = Math.atan2(centerY - cursorY, centerX - cursorX);
    const distance = 300;

    const newX = Math.cos(angle) * distance;
    const newY = Math.sin(angle) * distance;

    setNoButtonPos({ x: newX, y: newY });
  };

  const handleMouseMove = (e) => {
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const nextX = e.clientX - containerRect.left;
      const nextY = e.clientY - containerRect.top;
      const now = performance.now();
      const prev = cursorRef.current;
      const dt = Math.max((now - (prev.lastTs || now)) / 1000, 0.001);
      const vx = (nextX - prev.x) / dt;
      const vy = (nextY - prev.y) / dt;

      cursorRef.current = {
        x: nextX,
        y: nextY,
        active: true,
        vx,
        vy,
        lastTs: now,
      };

      const speed = Math.hypot(vx, vy);
      if (speed > 1) {
        cursorHeadingRef.current = { x: vx / speed, y: vy / speed };
      }
    }

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

  const handleMouseLeave = () => {
    cursorRef.current.active = false;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    const obstacles = getObstacleRects(containerRect);

    if (kittenVelocitiesRef.current.length === 0) {
      kittenVelocitiesRef.current = initialKittens.map(() => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 28 + Math.random() * 30;
        return {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        };
      });
      kittenAngularVelocitiesRef.current = initialKittens.map(
        () => (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 10)
      );
    }

    if (kittenPositionsRef.current.length === 0) {
      kittenPositionsRef.current = initialKittens.map((kitten, idx) => {
        const radius = kittenSizes[idx] / 2;
        let x = (kitten.left / 100) * width;
        let y = (kitten.top / 100) * height;

        x = Math.max(radius, Math.min(width - radius, x));
        y = Math.max(radius, Math.min(height - radius, y));

        for (let attempt = 0; attempt < 30; attempt += 1) {
          const collides = obstacles.some((rect) => {
            const closestX = Math.max(rect.left, Math.min(x, rect.right));
            const closestY = Math.max(rect.top, Math.min(y, rect.bottom));
            const dx = x - closestX;
            const dy = y - closestY;
            return dx * dx + dy * dy < radius * radius;
          });

          if (!collides) break;

          x = radius + Math.random() * Math.max(1, width - radius * 2);
          y = radius + Math.random() * Math.max(1, height - radius * 2);
        }

        return { x, y, angle: Math.random() * 360 };
      });
      setKittenPositions(kittenPositionsRef.current);
    }

    const step = (time) => {
      const currentContainer = containerRef.current;
      if (!currentContainer) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      const rect = currentContainer.getBoundingClientRect();
      const frameWidth = rect.width;
      const frameHeight = rect.height;
      const frameObstacles = getObstacleRects(rect);

      if (lastFrameTimeRef.current == null) {
        lastFrameTimeRef.current = time;
      }
      const dt = Math.min((time - lastFrameTimeRef.current) / 1000, 0.032);
      lastFrameTimeRef.current = time;

      const positions = kittenPositionsRef.current.map((p) => ({ ...p }));
      const velocities = kittenVelocitiesRef.current;
      const randomizeSpinOnBounce = (idx) => {
        const current = kittenAngularVelocitiesRef.current[idx] || 0;
        const currentDirection = current >= 0 ? 1 : -1;
        const flipDirection = Math.random() < 0.45;
        const nextDirection = flipDirection ? -currentDirection : currentDirection;
        const nextSpeed = 5 + Math.random() * 18;
        kittenAngularVelocitiesRef.current[idx] = nextDirection * nextSpeed;
      };

      positions.forEach((position, idx) => {
        const velocity = velocities[idx];
        const radius = kittenSizes[idx] / 2;
        let bounced = false;

        if (cursorRef.current.active) {
          const heading = cursorHeadingRef.current;
          const dirX = -heading.x;
          const dirY = -heading.y;
          const perpX = -dirY;
          const perpY = dirX;
          const lane = idx % 8;
          const rank = Math.floor(idx / 8);
          const tailDistance = 20 + rank * 16;
          const laneOffset = (lane - 3.5) * 10;
          const wave = Math.sin(time * 0.0016 + idx * 0.37) * 8;
          const targetX = cursorRef.current.x + dirX * tailDistance + perpX * (laneOffset + wave);
          const targetY = cursorRef.current.y + dirY * tailDistance + perpY * (laneOffset + wave);
          const dx = targetX - position.x;
          const dy = targetY - position.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 0.001) {
            const nx = dx / dist;
            const ny = dy / dist;
            const pull = Math.min(150, 24 + dist * 0.11);
            velocity.vx += nx * pull * dt;
            velocity.vy += ny * pull * dt;
          }
        }

        const drag = Math.pow(0.996, dt * 60);
        velocity.vx *= drag;
        velocity.vy *= drag;

        position.x += velocity.vx * dt;
        position.y += velocity.vy * dt;

        if (position.x - radius <= 0) {
          position.x = radius;
          velocity.vx = Math.abs(velocity.vx);
          bounced = true;
        } else if (position.x + radius >= frameWidth) {
          position.x = frameWidth - radius;
          velocity.vx = -Math.abs(velocity.vx);
          bounced = true;
        }

        if (position.y - radius <= 0) {
          position.y = radius;
          velocity.vy = Math.abs(velocity.vy);
          bounced = true;
        } else if (position.y + radius >= frameHeight) {
          position.y = frameHeight - radius;
          velocity.vy = -Math.abs(velocity.vy);
          bounced = true;
        }

        frameObstacles.forEach((obstacleRect) => {
          const hitObstacle = resolveCircleRectCollision(position, velocity, radius, obstacleRect);
          if (hitObstacle) {
            bounced = true;
          }
        });

        if (bounced) randomizeSpinOnBounce(idx);

        position.angle =
          (position.angle + kittenAngularVelocitiesRef.current[idx] * dt) % 360;
      });

      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const dist = Math.hypot(dx, dy);
          const minDist = kittenSizes[i] / 2 + kittenSizes[j] / 2;

          if (dist > 0 && dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            positions[i].x -= nx * (overlap / 2);
            positions[i].y -= ny * (overlap / 2);
            positions[j].x += nx * (overlap / 2);
            positions[j].y += ny * (overlap / 2);

            const rvx = velocities[j].vx - velocities[i].vx;
            const rvy = velocities[j].vy - velocities[i].vy;
            const speedAlongNormal = rvx * nx + rvy * ny;

            if (speedAlongNormal < 0) {
              const impulse = speedAlongNormal;
              velocities[i].vx += impulse * nx;
              velocities[i].vy += impulse * ny;
              velocities[j].vx -= impulse * nx;
              velocities[j].vy -= impulse * ny;
              randomizeSpinOnBounce(i);
              randomizeSpinOnBounce(j);
            }
          }
        }
      }

      kittenPositionsRef.current = positions;
      setKittenPositions(positions);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      lastFrameTimeRef.current = null;
    };
  }, []);

  return (
    <div
      className="valentine-question-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      {initialKittens.map((kitten, idx) => (
        <motion.div
          key={`kitten-${kitten.id}`}
          className="magnetic-kitten"
          style={{
            position: "absolute",
            left: `${kittenPositions[idx]?.x ?? 0}px`,
            top: `${kittenPositions[idx]?.y ?? 0}px`,
            fontSize: `${kittenSizes[idx]}px`,
            transform: `translate(-50%, -50%) rotate(${kittenPositions[idx]?.angle ?? 0}deg)`,
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {"\uD83D\uDE3B"}
        </motion.div>
      ))}

      <motion.div
        className="valentine-question-content collision-obstacle"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        style={{ zIndex: 100 }}
      >
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
            {"\u2764\uFE0F"}
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
          {"Let me show you something special... \uD83D\uDC9D"}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {"YES \uD83D\uDC95"}
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
              {"NO \uD83D\uDE22"}
            </motion.button>
          ) : (
            <button className="locked-button" disabled>
              {"\uD83D\uDD10 Can't say NO yet"}
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
