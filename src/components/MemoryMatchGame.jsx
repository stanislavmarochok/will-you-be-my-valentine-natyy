import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import "../styles/memory.css";

const photoModules = import.meta.glob("../assets/memory/*.{png,jpg,jpeg,webp,gif,avif}", {
  eager: true,
});

const photoSources = Object.values(photoModules)
  .map((asset) => asset.default)
  .filter(Boolean);

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createDeck() {
  const pairs = photoSources.flatMap((src, pairId) => [
    { id: `${pairId}-a`, pairId, src },
    { id: `${pairId}-b`, pairId, src },
  ]);
  return shuffle(pairs);
}

export default function MemoryMatchGame({ onBack, onDevNext }) {
  const [cards, setCards] = useState(() => createDeck());
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState([]);
  const [isResolving, setIsResolving] = useState(false);
  const [layout, setLayout] = useState({ columns: 4, cardWidth: 86, gap: 10 });
  const gridWrapRef = useRef(null);

  const hasEnoughPhotos = photoSources.length >= 2;
  const totalPairs = photoSources.length;

  const won = hasEnoughPhotos && matchedPairIds.length === totalPairs;

  useEffect(() => {
    const calculateLayout = () => {
      const totalCards = cards.length;
      if (!totalCards) return;

      const viewportWidth = window.innerWidth;
      const gridWrap = gridWrapRef.current;
      const horizontalGap = viewportWidth < 768 ? 8 : 10;
      const verticalGap = viewportWidth < 768 ? 8 : 10;
      const availableWidth = Math.max(
        220,
        gridWrap?.clientWidth ?? viewportWidth - (viewportWidth < 768 ? 48 : 120)
      );
      const availableHeight = Math.max(
        140,
        gridWrap?.clientHeight ?? window.innerHeight - (viewportWidth < 768 ? 265 : 300)
      );

      let best = { columns: 2, cardWidth: 36 };

      for (let columns = 2; columns <= totalCards; columns += 1) {
        const rows = Math.ceil(totalCards / columns);
        const maxWidthPerCard = (availableWidth - horizontalGap * (columns - 1)) / columns;
        const maxHeightPerCard = (availableHeight - verticalGap * (rows - 1)) / rows;
        const widthFromHeight = maxHeightPerCard / 1.25;
        const usableWidth = Math.floor(Math.min(maxWidthPerCard, widthFromHeight));

        if (usableWidth > best.cardWidth) {
          best = { columns, cardWidth: usableWidth };
        }
      }

      setLayout((prev) => {
        const next = {
          columns: best.columns,
          cardWidth: Math.max(24, best.cardWidth),
          gap: horizontalGap,
        };
        if (
          prev.columns === next.columns &&
          prev.cardWidth === next.cardWidth &&
          prev.gap === next.gap
        ) {
          return prev;
        }
        return next;
      });
    };

    calculateLayout();
    window.addEventListener("resize", calculateLayout);
    const resizeObserver =
      gridWrapRef.current && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(calculateLayout)
        : null;
    if (resizeObserver && gridWrapRef.current) {
      resizeObserver.observe(gridWrapRef.current);
    }

    return () => {
      window.removeEventListener("resize", calculateLayout);
      resizeObserver?.disconnect();
    };
  }, [cards.length]);

  const handleReset = () => {
    setCards(createDeck());
    setFlippedIds([]);
    setMatchedPairIds([]);
    setIsResolving(false);
  };

  const revealCard = (clickedCard) => {
    if (!hasEnoughPhotos || isResolving) return;
    if (flippedIds.includes(clickedCard.id)) return;
    if (matchedPairIds.includes(clickedCard.pairId)) return;

    const nextFlipped = [...flippedIds, clickedCard.id];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length < 2) return;

    const [firstId, secondId] = nextFlipped;
    const firstCard = cards.find((card) => card.id === firstId);
    const secondCard = cards.find((card) => card.id === secondId);

    if (!firstCard || !secondCard) {
      setFlippedIds([]);
      return;
    }

    if (firstCard.pairId === secondCard.pairId) {
      setMatchedPairIds((prev) => [...prev, firstCard.pairId]);
      setFlippedIds([]);
      return;
    }

    setIsResolving(true);
    window.setTimeout(() => {
      setFlippedIds([]);
      setIsResolving(false);
    }, 850);
  };

  const instruction = useMemo(() => {
    if (!hasEnoughPhotos) {
      return "Pridaj aspoň 2 fotky do src/assets/memory a hra sa automaticky spustí.";
    }
    return "Nájdi rovnaké páry fotiek. Zlá dvojica sa po chvíli otočí späť.";
  }, [hasEnoughPhotos]);

  const handleCardPointerMove = (event) => {
    if (event.pointerType === "touch") return;

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;
    const clampedX = Math.max(0, Math.min(1, relX));
    const clampedY = Math.max(0, Math.min(1, relY));

    const rotateY = (clampedX - 0.5) * 12;
    const rotateX = (0.5 - clampedY) * 12;

    card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
    card.style.setProperty("--glow-x", `${(clampedX * 100).toFixed(1)}%`);
    card.style.setProperty("--glow-y", `${(clampedY * 100).toFixed(1)}%`);
    card.style.setProperty("--lift", "-6px");
  };

  const handleCardPointerLeave = (event) => {
    const card = event.currentTarget;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--glow-x", "50%");
    card.style.setProperty("--glow-y", "50%");
    card.style.setProperty("--lift", "0px");
  };

  return (
    <div className="memory-container">
      <motion.div
        className="memory-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          type="button"
          className="memory-back-btn"
          onClick={onBack}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Späť"
        >
          ←
        </motion.button>
        <button
          type="button"
          className="memory-dev-next"
          onClick={onDevNext}
          aria-label="Skocit na dalsi level"
          title="Dev: dalsi level"
        />

        <h2 className="memory-title">Hra 1: Nájdi pár</h2>
        <p className="memory-subtitle">{instruction}</p>

        {hasEnoughPhotos ? (
          <div className="memory-grid-wrap" ref={gridWrapRef}>
            <div
              className="memory-grid"
              style={{
                "--memory-columns": layout.columns,
                "--memory-card-width": `${layout.cardWidth}px`,
                "--memory-gap": `${layout.gap}px`,
                "--memory-grid-width": `${
                  layout.columns * layout.cardWidth + layout.gap * (layout.columns - 1)
                }px`,
              }}
            >
              {cards.map((card) => {
                const isFlipped =
                  flippedIds.includes(card.id) || matchedPairIds.includes(card.pairId);

                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`memory-card ${isFlipped ? "is-flipped" : ""}`}
                    onClick={() => revealCard(card)}
                    onPointerMove={handleCardPointerMove}
                    onPointerLeave={handleCardPointerLeave}
                    disabled={isResolving || matchedPairIds.includes(card.pairId)}
                  >
                    <span className="memory-card-inner">
                      <span className="memory-face memory-front">
                        <img src={card.src} alt="Memory card" loading="lazy" />
                      </span>
                      <span className="memory-face memory-back">💘</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="memory-empty">Čakám na fotky v priečinku `src/assets/memory`.</div>
        )}

        <div className="memory-actions">
          <button type="button" className="memory-reset-btn" onClick={handleReset}>
            Zamiešať znova
          </button>
          {won && <span className="memory-win">Perfektne, všetky páry sú nájdené.</span>}
        </div>
      </motion.div>
    </div>
  );
}
