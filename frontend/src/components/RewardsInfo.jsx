import HelpTip from "./HelpTip.jsx";
import RewardIcon from "./RewardIcon.jsx";
import { formatNumber, REWARD_META, REWARD_ORDER } from "../rewards";

export default function RewardsInfo({ data }) {
  return (
    <div className="card-grid">
      <article className="info-card" style={{ gridColumn: "1 / -1" }}>
        <div className="head-with-help">
          <h3>How Mysterious Sale works</h3>
          <HelpTip
            title="Rewards"
            steps={[
              "This page is a reference: floor costs, discount notes, and the SG charm table.",
              "Normal rewards cost 10, discounted cost 5, Floor 13 is free after 1–12.",
              "70 charms is the maximum. Charm total is converted to CSG with the table below.",
            ]}
          />
        </div>
        {(data.notes || []).map((note) => (
          <p key={note}>{note}</p>
        ))}
      </article>
      <article className="info-card">
        <h3>Reward types</h3>
        <div className="legend">
          {REWARD_ORDER.map((name) => (
            <span className="loot-chip" key={name}>
              <RewardIcon type={name} /> {REWARD_META[name].label}
            </span>
          ))}
        </div>
      </article>
      <article className="info-card">
        <h3>SG cost table</h3>
        <p>Charm total is converted to starry gems with these caps:</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Total cost &lt;=</th>
                <th>SG cost</th>
              </tr>
            </thead>
            <tbody>
              {(data.sg_table || []).map((row) => (
                <tr key={row.max_cost}>
                  <td>{row.max_cost}</td>
                  <td>{formatNumber(row.sg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      {(data.floors || []).map((floor) => (
        <article className="info-card" key={floor.floor}>
          <h3>{floor.label}</h3>
          {floor.rewards.map((reward) => (
            <p key={reward.reward_type}>
              <RewardIcon type={reward.reward_type} />{" "}
              {REWARD_META[reward.reward_type]?.label || reward.reward_type}
              {": "}
              {reward.cost}
              {reward.discounted ? " (discounted)" : ""}
            </p>
          ))}
        </article>
      ))}
    </div>
  );
}
