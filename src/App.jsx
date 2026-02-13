import { useState } from "react";
import ValentineQuestion from "./components/ValentineQuestion";
import AuthGate from "./components/AuthGate";

function App() {
  const [stage, setStage] = useState("valentine");

  const goHome = () => {
    setStage("valentine");
  };

  if (stage === "valentine") {
    return <ValentineQuestion onYes={() => setStage("auth")} />;
  }

  return <AuthGate onSuccess={goHome} goHome={goHome} />;
}

export default App;
