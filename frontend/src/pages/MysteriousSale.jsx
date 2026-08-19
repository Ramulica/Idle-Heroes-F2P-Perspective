import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CasesPlanner from "../components/CasesPlanner.jsx";
import EventPreview from "../components/EventPreview.jsx";
import FloorPlanner from "../components/FloorPlanner.jsx";
import HelpTip from "../components/HelpTip.jsx";
import RewardsInfo from "../components/RewardsInfo.jsx";
import { useAuth } from "../auth";

const PAGES = [
  { id: "cases", label: "1. Event Plans" },
  { id: "planner", label: "2. Floor Planner" },
  { id: "rewards", label: "3. Rewards" },
  { id: "preview", label: "4. Event Preview" },
];

export default function MysteriousSale({ data, onChange }) {
  const [page, setPage] = useState("cases");
  const navigate = useNavigate();
  const guest = Boolean(useAuth()?.user?.guest);

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Mysterious Sale</h1>
              <HelpTip
                title="Mysterious Sale"
                steps={[
                  "Event Plans: your own plans. Set event weeks, then add completions and how many times you run them. 17 event weeks = 1 year.",
                  "Floor Planner: tap a completion, then pick one reward per floor. Floor 13 unlocks after floors 1–12.",
                  "CSG / year comes from the CSG Calculator. An event plan estimates CSG for that plan’s period.",
                  "Rewards and Event Preview are reference lists.",
                ]}
              />
            </div>
            <p>
              Event Plans are yours — pick a period, then add completions and
              how many times you run them. Floor Planner is where you build those
              completions.
            </p>
          </div>
          <button className="tan-btn" type="button" onClick={() => navigate("/")}>
            Back to menu
          </button>
        </div>
        {guest ? (
          <p className="guest-banner">
            Guest mode — you can look, but nothing is saved and you cannot rate.
          </p>
        ) : null}
        <div className="shell-body">
          <nav className="sidebar">
            {PAGES.map((item) => (
              <button
                key={item.id}
                className={`nav-btn${page === item.id ? " active" : ""}`}
                type="button"
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <section className="main-panel">
            {page === "planner" && (
              <FloorPlanner data={data} onChange={onChange} />
            )}
            {page === "cases" && (
              <CasesPlanner
                data={data}
                onChange={onChange}
                onOpenPlanner={() => setPage("planner")}
              />
            )}
            {page === "rewards" && <RewardsInfo data={data} />}
            {page === "preview" && <EventPreview events={data.events} />}
          </section>
        </div>
      </div>
    </div>
  );
}
