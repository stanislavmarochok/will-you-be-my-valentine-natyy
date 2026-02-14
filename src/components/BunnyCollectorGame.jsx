import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import "../styles/bunny.css";

const GRID_SIZE = 10;
const TICK_MS = 420;
const PREVIEW_MS = 1000;
const RESUME_COUNTDOWN_START = 1;
const WALL_COUNT = 7;
const TRAP_COUNT = 8;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

const photoModules = import.meta.glob("../assets/memory/*.{png,jpg,jpeg,webp,gif,avif}", {
  eager: true,
});

const photoSources = Object.values(photoModules)
  .map((asset) => asset.default)
  .filter(Boolean);
const uniquePhotoSources = Array.from(new Set(photoSources));

function keyFor(x, y) {
  return `${x},${y}`;
}

function createRng(seed) {
  let value = (seed % 2147483647) + 1;
  return () => {
    value = (value * 48271) % 2147483647;
    return value / 2147483647;
  };
}

function randomFreeCell(rng, blocked) {
  for (let attempt = 0; attempt < 1200; attempt += 1) {
    const x = Math.floor(rng() * GRID_SIZE);
    const y = Math.floor(rng() * GRID_SIZE);
    const key = keyFor(x, y);
    if (!blocked.has(key)) return { x, y, key };
  }
  return null;
}

function createLevel(seed) {
  const rng = createRng(seed);
  const start = { x: 1, y: 1 };
  const blocked = new Set([
    keyFor(start.x, start.y),
    keyFor(start.x + 1, start.y),
    keyFor(start.x, start.y + 1),
  ]);

  const walls = new Set();
  const traps = new Set();

  for (let i = 0; i < WALL_COUNT; i += 1) {
    const pos = randomFreeCell(rng, blocked);
    if (!pos) break;
    walls.add(pos.key);
    blocked.add(pos.key);
  }

  for (let i = 0; i < TRAP_COUNT; i += 1) {
    const pos = randomFreeCell(rng, blocked);
    if (!pos) break;
    traps.add(pos.key);
    blocked.add(pos.key);
  }

  const items = [];
  for (let index = 0; index < uniquePhotoSources.length; index += 1) {
    const pos = randomFreeCell(rng, blocked);
    if (!pos) break;
    blocked.add(pos.key);
    items.push({
      id: `photo-${index}`,
      src: uniquePhotoSources[index],
      x: pos.x,
      y: pos.y,
    });
  }

  return { start, walls, traps, items };
}

export default function BunnyCollectorGame({ onBack, onDevNext, onWin }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const level = useMemo(() => createLevel(seed), [seed]);

  const [bunny, setBunny] = useState(level.start);
  const [direction, setDirection] = useState("right");
  const [collected, setCollected] = useState([]);
  const [status, setStatus] = useState("playing");
  const [previewSrc, setPreviewSrc] = useState(null);
  const [deathFlash, setDeathFlash] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [resumeCountdown, setResumeCountdown] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const directionRef = useRef(direction);
  const previewTimeoutRef = useRef(null);
  const deathTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const winTimeoutRef = useRef(null);
  const collectedRef = useRef(new Set());

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    collectedRef.current = new Set(collected);
  }, [collected]);

  useEffect(() => {
    setBunny(level.start);
    setDirection("right");
    setCollected([]);
    setStatus("playing");
    setShowIntro(true);
    setResumeCountdown(null);
    setIsPaused(false);
  }, [level]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") setDirection("up");
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") setDirection("right");
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") setDirection("down");
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") setDirection("left");
      if (event.key.toLowerCase() === "p") setIsPaused((prev) => !prev);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (status !== "playing" || previewSrc || showIntro || resumeCountdown !== null || isPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setBunny((prev) => {
        const step = DIRECTIONS[directionRef.current];
        const next = { x: prev.x + step.x, y: prev.y + step.y };

        const outOfBounds =
          next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE;
        const nextKey = keyFor(next.x, next.y);
        const hitsWall = level.walls.has(nextKey);
        const hitsTrap = level.traps.has(nextKey);

        if (outOfBounds || hitsWall || hitsTrap) {
          setStatus("dead");
          setDeathFlash(true);
          if (deathTimeoutRef.current) window.clearTimeout(deathTimeoutRef.current);
          deathTimeoutRef.current = window.setTimeout(() => {
            setBunny(level.start);
            setDirection("right");
            setCollected([]);
            setPreviewSrc(null);
            setResumeCountdown(null);
            setIsPaused(false);
            setStatus("playing");
            setDeathFlash(false);
          }, 1100);
          return prev;
        }

        const pickup = level.items.find((item) => {
          return item.x === next.x && item.y === next.y && !collectedRef.current.has(item.id);
        });

        if (pickup) {
          setCollected((old) => {
            if (old.includes(pickup.id)) return old;
            return [...old, pickup.id];
          });
          setPreviewSrc(pickup.src);
          if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = window.setTimeout(() => {
            setPreviewSrc(null);
            setResumeCountdown(RESUME_COUNTDOWN_START);
          }, PREVIEW_MS);
        }

        return next;
      });
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [isPaused, level, previewSrc, resumeCountdown, showIntro, status]);

  useEffect(() => {
    if (resumeCountdown === null) return undefined;
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = window.setInterval(() => {
      setResumeCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    };
  }, [resumeCountdown]);

  useEffect(() => {
    if (collected.length > 0 && collected.length === level.items.length && level.items.length > 0) {
      setStatus("won");
    }
  }, [collected.length, level.items.length]);

  useEffect(() => {
    if (status !== "won" || !onWin) return undefined;
    if (winTimeoutRef.current) window.clearTimeout(winTimeoutRef.current);
    winTimeoutRef.current = window.setTimeout(() => {
      onWin();
    }, 2200);
    return () => {
      if (winTimeoutRef.current) window.clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = null;
    };
  }, [onWin, status]);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
      if (deathTimeoutRef.current) window.clearTimeout(deathTimeoutRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
      if (winTimeoutRef.current) window.clearTimeout(winTimeoutRef.current);
    };
  }, []);

  const pickupSet = useMemo(() => new Set(collected), [collected]);
  const hasPhotos = level.items.length > 0;

  return (
    <div className="bunny-container">
      <motion.div
        className={`bunny-content ${deathFlash ? "is-dead" : ""}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          type="button"
          className="bunny-back-btn"
          onClick={onBack}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Späť"
        >
          ←
        </motion.button>

        <button
          type="button"
          className="bunny-dev-reset"
          onClick={onDevNext}
          aria-label="Dev dalsia hra"
          title="Dev: dalsia hra"
        />

        <h2 className="bunny-title">Hra 2: Zajačik Zberá Spomienky</h2>
        <p className="bunny-subtitle">
          Zajačik stále skáče. Zmeň smer šípkami alebo WASD a pozbieraj všetky fotky.
        </p>

        <div className="bunny-stats">
          <span>
            Collected: {collected.length}/{level.items.length}
          </span>
          <span>
            Stav:{" "}
            {status === "playing" ? "hrá sa" : status === "dead" ? "ups..." : "výhra"}
          </span>
        </div>
        {hasPhotos ? (
          <div className="bunny-board-wrap">
            <div className="bunny-board">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const x = index % GRID_SIZE;
                const y = Math.floor(index / GRID_SIZE);
                const posKey = keyFor(x, y);
                const isWall = level.walls.has(posKey);
                const isTrap = level.traps.has(posKey);
                const item = level.items.find((photo) => photo.x === x && photo.y === y);
                const isCollected = item ? pickupSet.has(item.id) : false;

                return (
                  <div
                    key={posKey}
                    className={`bunny-cell ${isWall ? "is-wall" : ""} ${isTrap ? "is-trap" : ""}`}
                  >
                    {item && !isCollected && (
                      <img src={item.src} alt="" className="cell-photo-thumb" loading="lazy" />
                    )}
                  </div>
                );
              })}
              <span
                className={`bunny-sprite dir-${direction}`}
                style={{ "--bunny-x": bunny.x, "--bunny-y": bunny.y }}
                aria-hidden="true"
              >
                🐇
              </span>
            </div>
            {(resumeCountdown !== null || isPaused) && (
              <div className="bunny-board-overlay">
                <div className="bunny-countdown">
                  {resumeCountdown !== null ? (
                    <>
                      Zajačik sa pohne o <strong>{resumeCountdown}</strong>
                    </>
                  ) : (
                    <>Pauza</>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bunny-empty">Pridaj fotky do `src/assets/memory`, aby sa hra spustila.</div>
        )}

        <div className="bunny-controls">
          <button type="button" onClick={() => setDirection("up")}>
            ↑
          </button>
          <button type="button" onClick={() => setDirection("left")}>
            ←
          </button>
          <button type="button" onClick={() => setDirection("down")}>
            ↓
          </button>
          <button type="button" onClick={() => setDirection("right")}>
            →
          </button>
          <button type="button" onClick={() => setIsPaused((prev) => !prev)}>
            {isPaused ? "Pokračovať" : "Pauza"}
          </button>
        </div>

        {status === "won" && <div className="bunny-win">Vyhrala si. Presúvam ťa na ďalší level...</div>}

        {previewSrc && (
          <div className="pickup-preview">
            <div className="pickup-preview-card">
              <img src={previewSrc} alt="Picked memory" />
            </div>
          </div>
        )}

        {showIntro && (
          <div className="bunny-intro-overlay">
            <div className="bunny-intro-card">
              <h3>Naše fotky sa stratili...</h3>
              <p>
                Kúzelný zajačik ich vie pozbierať, ale potrebuje tvoju pomoc.
                <br />
                Naveď ho správnym smerom a zachráň všetky spomienky.
              </p>
              <button type="button" onClick={() => setShowIntro(false)}>
                Pomôž zajačikovi
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
