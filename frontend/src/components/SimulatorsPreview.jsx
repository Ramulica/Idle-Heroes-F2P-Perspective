import { useState } from "react";
import HelpTip from "./HelpTip.jsx";
import AwakensSimulator from "./AwakensSimulator.jsx";

const SIMS = [{ id: "awakens", label: "Awakens" }];

export default function SimulatorsPreview({ yearlyAwakens = 0 }) {
  const [simId, setSimId] = useState("awakens");

  return (
    <div className="simulators">
      <article className="info-card" style={{ marginBottom: 12 }}>
        <div className="head-with-help">
          <h3>Simulators</h3>
          <HelpTip
            title="Simulators"
            steps={[
              "Awakens is the first simulator. More can be added later.",
              "It uses in-game rarity chances and your yearly awaken income from the Awakens Calculator.",
            ]}
          />
        </div>
        <p>Turn resource income into expected rolls. Start with awakens.</p>
      </article>
      <div className="period-presets">
        {SIMS.map((sim) => (
          <button
            key={sim.id}
            className={simId === sim.id ? "gold-btn" : "tan-btn"}
            type="button"
            onClick={() => setSimId(sim.id)}
          >
            {sim.label}
          </button>
        ))}
      </div>
      {simId === "awakens" ? (
        <AwakensSimulator yearlyAwakens={yearlyAwakens} />
      ) : null}
    </div>
  );
}
