import { useEffect, useRef, useState } from "react";

const EMOJI_POOL = [
  "\uD83D\uDE3B",
  "\uD83D\uDC96",
  "\uD83D\uDC95",
  "\uD83D\uDC98",
  "\uD83C\uDF38",
  "\u2728",
  "\uD83C\uDF80",
  "\uD83E\uDD70",
  "\uD83D\uDC9E",
  "\uD83D\uDC97",
  "\uD83C\uDF37",
  "\uD83D\uDC9D",
];
const MAX_TRAIL = 100;
const MAX_SPAWNS_PER_EVENT = 2;
const SPAWN_SPACING = 80;

export default function CursorEmojiTrail() {
  const [trail, setTrail] = useState([]);
  const cursorRef = useRef({
    x: 0,
    y: 0,
    lastSpawnX: null,
    lastSpawnY: null,
  });
  const idRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const createParticle = (x, y) => {
      const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
      return {
        id: idRef.current++,
        emoji,
        x,
        y,
        age: 0,
        life: 1500 + Math.random() * 700,
        driftX: (Math.random() - 0.5) * 0.03,
        driftY: -0.02 - Math.random() * 0.03,
      };
    };

    const onMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      const cursor = cursorRef.current;
      cursor.x = x;
      cursor.y = y;

      const spawned = [];
      if (cursor.lastSpawnX == null || cursor.lastSpawnY == null) {
        cursor.lastSpawnX = x;
        cursor.lastSpawnY = y;
        spawned.push(createParticle(x, y));
      } else {
        const dx = x - cursor.lastSpawnX;
        const dy = y - cursor.lastSpawnY;
        const dist = Math.hypot(dx, dy);
        if (dist >= SPAWN_SPACING) {
          const steps = Math.min(Math.floor(dist / SPAWN_SPACING), MAX_SPAWNS_PER_EVENT);
          for (let i = 1; i <= steps; i += 1) {
            const t = (i * SPAWN_SPACING) / dist;
            spawned.push(createParticle(cursor.lastSpawnX + dx * t, cursor.lastSpawnY + dy * t));
          }
          const remain = dist % SPAWN_SPACING;
          const ratio = remain / dist;
          cursor.lastSpawnX = x - dx * ratio;
          cursor.lastSpawnY = y - dy * ratio;
        }
      }

      if (spawned.length > 0) {
        setTrail((prev) => [...prev, ...spawned].slice(-MAX_TRAIL));
      }
    };

    const onMouseLeave = () => {
      cursorRef.current.lastSpawnX = null;
      cursorRef.current.lastSpawnY = null;
    };

    let lastFrame = performance.now();
    const tick = (now) => {
      const dt = now - lastFrame;
      lastFrame = now;

      setTrail((prev) =>
        prev
          .map((item) => ({
            ...item,
            x: item.x + item.driftX * dt,
            y: item.y + item.driftY * dt,
            age: item.age + dt,
          }))
          .filter((item) => item.age < item.life)
          .slice(-MAX_TRAIL)
      );

      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {trail.map((item) => {
        const dist = Math.hypot(cursorRef.current.x - item.x, cursorRef.current.y - item.y);
        const proximity = Math.max(0, 1 - dist / 260);
        const grow = Math.min(1, item.age / 180);
        const lifeProgress = item.age / item.life;
        const size = 23 + grow * (14 + proximity * 30);
        const opacity = Math.max(0, (1 - lifeProgress) * (0.7 + proximity * 0.75));

        return (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: `${item.x}px`,
              top: `${item.y}px`,
              transform: "translate(-50%, -50%)",
              fontSize: `${size}px`,
              opacity,
              userSelect: "none",
              filter: "drop-shadow(0 0 8px rgba(255, 105, 180, 0.35))",
            }}
          >
            {item.emoji}
          </div>
        );
      })}
    </div>
  );
}
