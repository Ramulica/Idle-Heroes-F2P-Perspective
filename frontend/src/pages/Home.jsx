import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, GUEST_SG_KEY } from "../auth";
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
  const guest = Boolean(user?.guest);
  const yearCsg = useMemo(() => yearlyCsg(sgState), [sgState]);

  useEffect(() => {
    if (guest) {
      try {
        const raw = sessionStorage.getItem(GUEST_SG_KEY);
        if (raw) {
          setSgState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
        }
      } catch {
        /* ignore */
      }
      return undefined;
    }
    api
      .getSgCalc()
      .then((payload) => {
        setSgState({ ...DEFAULT_STATE, ...(payload.state || {}) });
      })
      .catch(() => {});
  }, [guest]);

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
                  "Tools holds the CSG, Awakens, Pages of Destiny, and Monster Tickets calculators, plus Mysterious Sale.",
                  "Your username is saved on this device. Log out from the footer when you are done.",
                  "Guest mode does not save data and cannot rate.",
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
              {guest ? "Guest" : user?.username}
            </button>
          </div>
        </div>
        {guest ? (
          <p className="guest-banner">
            Guest mode — nothing is saved, and you cannot rate. Create an account
            to keep your calculator, cases, and ratings.
          </p>
        ) : null}
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
                      "This app is an F2P helper. Use Tools for CSG, Awakens, Pages of Destiny, and Mysterious Sale.",
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
                <article className="guide-card">
                  <div className="head-with-help">
                    <h3>Awakens Calculator</h3>
                    <HelpTip
                      title="Awakens Calculator"
                      steps={[
                        "Same awaken ticks as the CSG Calculator. Changes save to both.",
                        "Tick Pages of Destiny to add 30 awakens per 100-page event into the total.",
                      ]}
                    />
                  </div>
                  <p>
                    Plan Trial of the Champion rank, chests, Sky Labyrinth, and
                    Pages of Destiny awakens. Synced with the CSG Calculator.
                  </p>
                  <button
                    className="gold-btn"
                    type="button"
                    onClick={() => navigate("/guides/awakens-calculator")}
                  >
                    Open tool
                  </button>
                </article>
                <article className="guide-card">
                  <div className="head-with-help">
                    <h3>Pages of Destiny Calculator</h3>
                    <HelpTip
                      title="Pages of Destiny Calculator"
                      steps={[
                        "Tick arena store, monthly gems, Fantasy Factory, and other sources.",
                        "Every 100 pages is one event: 30 awakens plus a special box.",
                        "Tick those awakens in the Awakens Calculator if you want them in CSG.",
                      ]}
                    />
                  </div>
                  <p>
                    Add up Pages of Destiny income, then see how many 100-page
                    events you can run each year.
                  </p>
                  <button
                    className="gold-btn"
                    type="button"
                    onClick={() => navigate("/guides/pages-calculator")}
                  >
                    Open tool
                  </button>
                </article>
                <article className="guide-card">
                  <div className="head-with-help">
                    <h3>Monster Tickets Calculator</h3>
                    <HelpTip
                      title="Monster Tickets Calculator"
                      steps={[
                        "Tick other sources from special events, Reverie keys, and CD keys.",
                        "The default is 40 tickets / year. Change the number if yours is different.",
                      ]}
                    />
                  </div>
                  <p>
                    Count Monster Tickets from special events, Reverie keys, and
                    CD keys over a time period.
                  </p>
                  <button
                    className="gold-btn"
                    type="button"
                    onClick={() => navigate("/guides/monster-tickets")}
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
            {guest ? "Log in" : "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
}
