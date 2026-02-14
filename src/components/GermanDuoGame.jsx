import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import "../styles/german.css";

const GAME_QUESTIONS = [
  {
    prompt: "Vyber nemecky preklad: 'jablko'",
    choices: ["der Apfel", "die Milch", "das Brot"],
    answer: 0,
  },
  {
    prompt: "Vyber nemecky preklad: 'Som stastny'",
    choices: ["Ich bin glucklich", "Du bist glucklich", "Ich habe Hunger"],
    answer: 0,
  },
  {
    prompt: "Vyber nemecky preklad: 'Dobrú noc'",
    choices: ["Guten Morgen", "Gute Nacht", "Auf Wiedersehen"],
    answer: 1,
  },
  {
    prompt: "Vyber nemecky preklad: 'Kde je stanica?'",
    choices: ["Wo ist der Bahnhof?", "Wie geht es dir?", "Ich komme aus Berlin."],
    answer: 0,
  },
  {
    prompt: "Vyber nemecky preklad: 'Prosim si kavu'",
    choices: ["Ich habe einen Kaffee", "Ich mochte einen Kaffee", "Ich trinke keinen Kaffee"],
    answer: 1,
  },
  {
    prompt: "Vyber nemecky preklad: 'Milujeme fotky'",
    choices: ["Wir lieben Fotos", "Ihr liebt Fotos", "Sie lieben Fotos"],
    answer: 0,
  },
  {
    prompt: "Vyber nemecky preklad: 'dnes'",
    choices: ["morgen", "heute", "gestern"],
    answer: 1,
  },
  {
    prompt: "Vyber nemecky preklad: 'Dakujem velmi pekne'",
    choices: ["Danke schon", "Bitte sehr", "Entschuldigung"],
    answer: 0,
  },
];

const MAX_HEARTS = 3;
const XP_PER_CORRECT = 12;

function OptionButton({ children, onClick, disabled, state }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`german-option ${state ? `is-${state}` : ""}`}
      whileHover={disabled ? {} : { y: -2, scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.button>
  );
}

export default function GermanDuoGame({ onBack, onComplete, onDevNext }) {
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [xp, setXp] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [failed, setFailed] = useState(false);
  const [completed, setCompleted] = useState(false);

  const current = GAME_QUESTIONS[index];
  const progress = useMemo(() => {
    if (completed) return 100;
    return Math.floor((index / GAME_QUESTIONS.length) * 100);
  }, [completed, index]);

  const reset = () => {
    setIndex(0);
    setHearts(MAX_HEARTS);
    setXp(0);
    setSelected(null);
    setChecked(false);
    setCorrect(false);
    setFailed(false);
    setCompleted(false);
  };

  const checkAnswer = () => {
    if (selected === null || checked || failed || completed) return;
    const isCorrect = selected === current.answer;
    setChecked(true);
    setCorrect(isCorrect);

    if (isCorrect) {
      setXp((old) => old + XP_PER_CORRECT);
      return;
    }

    setHearts((old) => {
      const next = old - 1;
      if (next <= 0) setFailed(true);
      return Math.max(0, next);
    });
  };

  const nextStep = () => {
    if (failed) {
      reset();
      return;
    }

    if (completed) {
      onComplete?.();
      return;
    }

    if (!checked) return;

    if (index >= GAME_QUESTIONS.length - 1) {
      setCompleted(true);
      return;
    }

    setIndex((old) => old + 1);
    setSelected(null);
    setChecked(false);
    setCorrect(false);
  };

  const ctaLabel = failed
    ? "Skusit hru znova"
    : completed
      ? "Pokracovat na dalsi level"
      : checked
        ? "Dalej"
        : "Skontrolovat";

  return (
    <div className="german-container">
      <motion.div
        className="german-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
      >
        <button type="button" className="german-back-btn" onClick={onBack} aria-label="Spat">
          ←
        </button>
        <button
          type="button"
          className="german-dev-next"
          onClick={onDevNext}
          aria-label="Dev dalsi level"
          title="Dev: dalsi level"
        />

        <div className="german-top">
          <div className="german-progress">
            <span className="german-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="german-meta">
            <span>XP {xp}</span>
            <span>Srdiecka {"❤".repeat(hearts) || "0"} 💕</span>
          </div>
        </div>

        <h2 className="german-title">Hra 3: Nemcina Duo 💘💖</h2>

        {failed ? (
          <motion.div className="german-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3>Dosli srdiecka 💔</h3>
            <p>Skus hru od zaciatku este raz.</p>
          </motion.div>
        ) : completed ? (
          <motion.div className="german-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3>Perfektne! 💕</h3>
            <p>Dokoncila si jazykovu hru.</p>
          </motion.div>
        ) : (
          <motion.div
            key={`question-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="german-question">{current.prompt}</p>
            <div className="german-options">
              {current.choices.map((choice, optionIndex) => {
                let state = "";
                if (checked) {
                  if (optionIndex === current.answer) state = "correct";
                  else if (optionIndex === selected) state = "wrong";
                } else if (optionIndex === selected) {
                  state = "selected";
                }

                return (
                  <OptionButton
                    key={choice}
                    state={state}
                    disabled={checked}
                    onClick={() => setSelected(optionIndex)}
                  >
                    {choice}
                  </OptionButton>
                );
              })}
            </div>
            {checked && (
              <div className={`german-feedback ${correct ? "ok" : "bad"}`}>
                {correct ? "Spravne! 💖" : "Toto nie je spravne."}
              </div>
            )}
          </motion.div>
        )}

        <div className="german-actions">
          <button
            type="button"
            className="german-cta"
            onClick={checked || failed || completed ? nextStep : checkAnswer}
            disabled={!failed && !completed && !checked && selected === null}
          >
            {ctaLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
