import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api";
import HelpTip from "../components/HelpTip.jsx";
import CsgAmount from "../components/CsgAmount.jsx";
import { DEFAULT_STATE, yearlyCsg } from "../sgCalc";

const NAV = [
  { id: "home", label: "Home" },
  { id: "tools", label: "Tools" },
  { id: "resources", label: "Resources" },
  { id: "events", label: "Events" },
];

export default function Home() {
  const [tab, setTab] = useState("tools");
  const [sgState, setSgState] = useState(DEFAULT_STATE);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const yearCsg = useMemo(() => yearlyCsg(sgState), [sgState]);

  useEffect(() => {
    api
      .getSgCalc()
      .then((payload) => {
        setSgState({ ...DEFAULT_STATE, ...(payload.state || {}) });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Idle Heroes F2P Perspective</h1>
              <HelpTip
                title="Main menu"
                steps={[
                  "CSG / year comes from your CSG Calculator. Tap it to open and fill in your account.",
                  "Tools holds the CSG Calculator and Mysterious Sale.",
                  "Your username is saved on this device. Log out from the footer when you are done.",
                ]}
              />
            </div>
            <p>Community guides for resources, events, and how to play them.</p>
          </div>
          <div className="shell-head-right">
            <button
              className="home-year-csg"
              type="button"
              onClick={() => navigate("/guides/sg-calculator")}
              title="From your CSG Calculator"
            >
              <span>CSG / year</span>
              <CsgAmount value={yearCsg} />
            </button>
            <button className="gold-btn" type="button">
              {user?.username}
            </button>
          </div>
        </div>
        <div className="shell-body">
          <nav className="sidebar">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`nav-btn${tab === item.id ? " active" : ""}`}
                type="button"
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <section className="main-panel">
            {tab === "home" && (
              <div className="info-card">
                <div className="head-with-help">
                  <h3>Welcome, summoner</h3>
                  <HelpTip
                    title="Home"
                    steps={[
                      "This app is an F2P helper. Use Tools to open the CSG Calculator and Mysterious Sale.",
                      "Create an account so your calculator and cases stay saved.",
                      "Press any (i) button in the app for short how-to steps.",
                    ]}
                  />
                </div>
                <p>
                  This is a small F2P-first helper for Idle Heroes. Start with
                  the CSG Calculator to plan Contract Starry Gem income, then
                  open Mysterious Sale for floor routes and cases.
                </p>
              </div>
            )}
            {tab === "tools" && (
              <div className="card-grid">
                <article className="guide-card">
                  <div className="head-with-help">
                    <h3>CSG Calculator</h3>
                    <HelpTip
                      title="CSG Calculator"
                      steps={[
                        "Open this tool and fill Void Corruption, awakens, and extra CSG sources.",
                        "The total is saved to your account and shown as CSG / year on the main menu and Cases.",
                        "Change the time period inside the calculator to see 1 month up to 5 years.",
                      ]}
                    />
                  </div>
                  <p>
                    Set your account, Void Corruption, and awaken sources, then
                    see CSG income from 1 month to 5 years.
                  </p>
                  <p className="guide-csg-line">
                    Your estimate: <CsgAmount value={yearCsg} /> / year
                  </p>
                  <button
                    className="gold-btn"
                    type="button"
                    onClick={() => navigate("/guides/sg-calculator")}
                  >
                    Open tool
                  </button>
                </article>
                <article className="guide-card">
                  <div className="head-with-help">
                    <h3>Mysterious Sale</h3>
                    <HelpTip
                      title="Mysterious Sale"
                      steps={[
                        "Floor Planner: pick or create a completion, then tap one reward per floor.",
                        "Cases: plan how many event weeks you play a completion. 17 event weeks = 1 year.",
                        "CSG cost of a case is compared with the CSG you earn in that period from the calculator.",
                      ]}
                    />
                  </div>
                  <p>
                    Plan 13 floors, save completion options, and build your own
                    cases with CSG cost, loot, and a time period.
                  </p>
                  <button
                    className="gold-btn"
                    type="button"
                    onClick={() => navigate("/guides/mysterious-sale")}
                  >
                    Open tool
                  </button>
                </article>
              </div>
            )}
            {tab === "resources" && (
              <div className="info-card">
                <div className="head-with-help">
                  <h3>Resources</h3>
                  <HelpTip
                    title="Resources"
                    steps={[
                      "This page is not built yet. It will list scrolls, orbs, wishing coins, and F2P spend advice.",
                      "Until then, use Mysterious Sale Rewards for sale floor loot.",
                    ]}
                  />
                </div>
                <p>
                  A later menu will cover scrolls, prophet orbs, wishing coins,
                  and where F2P players should spend them.
                </p>
              </div>
            )}
            {tab === "events" && (
              <div className="info-card">
                <div className="head-with-help">
                  <h3>Events</h3>
                  <HelpTip
                    title="Events"
                    steps={[
                      "This page is not built yet. Event calendars will live here.",
                      "Mysterious Sale already has last year’s Event Preview list.",
                    ]}
                  />
                </div>
                <p>
                  Event calendars and how-to pages will live here. Mysterious
                  Sale already includes last year’s preview list.
                </p>
              </div>
            )}
          </section>
        </div>
        <div className="shell-foot">
          <strong>Idle Heroes F2P Perspective</strong>
          <button className="tan-btn" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
