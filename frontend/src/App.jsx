import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api, subscribePending } from "./api";
import { AuthContext, GUEST_KEY, GUEST_USER } from "./auth";
import { LoadingOverlay, LoadingScreen } from "./components/LoadingSpinner.jsx";
import Home from "./pages/Home.jsx";
import MysteriousSale from "./pages/MysteriousSale.jsx";
import SgCalculator from "./pages/SgCalculator.jsx";
import AwakensCalculator from "./pages/AwakensCalculator.jsx";
import PagesCalculator from "./pages/PagesCalculator.jsx";
import MonsterTicketsCalculator from "./pages/MonsterTicketsCalculator.jsx";
import TreasureCouponsCalculator from "./pages/TreasureCouponsCalculator.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import { caseTotalsFromSlots } from "./caseTotals";

function PendingOverlay() {
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribePending(setPending), []);

  useEffect(() => {
    if (pending <= 0) {
      setVisible(false);
      return undefined;
    }
    const timer = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(timer);
  }, [pending]);

  if (!visible) return null;
  return <LoadingOverlay message="Working..." />;
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api
      .me()
      .then((result) => {
        if (result.user) {
          sessionStorage.removeItem(GUEST_KEY);
          setUser(result.user);
        } else if (sessionStorage.getItem(GUEST_KEY)) {
          setUser(GUEST_USER);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (sessionStorage.getItem(GUEST_KEY)) {
          setUser(GUEST_USER);
        } else {
          setUser(null);
        }
      });
  }, []);

  async function logout() {
    sessionStorage.removeItem(GUEST_KEY);
    if (!user?.guest) {
      await api.logout();
    }
    setUser(null);
  }

  if (user === undefined) {
    return <LoadingScreen message="Opening..." />;
  }
  if (!user) {
    return (
      <>
        <AuthPage onAuth={setUser} />
        <PendingOverlay />
      </>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/guides/sg-calculator" element={<SgCalculator />} />
        <Route path="/guides/awakens-calculator" element={<AwakensCalculator />} />
        <Route path="/guides/pages-calculator" element={<PagesCalculator />} />
        <Route path="/guides/monster-tickets" element={<MonsterTicketsCalculator />} />
        <Route path="/guides/treasure-coupons" element={<TreasureCouponsCalculator />} />
        <Route path="/guides/mysterious-sale" element={<MysteriousSaleGate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PendingOverlay />
    </AuthContext.Provider>
  );
}

function MysteriousSaleGate() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function refresh(options = {}) {
    const next = await api.bootstrap(options);
    setData(next);
  }

  function patchOption(updated) {
    setData((current) => {
      if (!current?.options || !updated?.id) return current;
      const options = current.options.map((row) =>
        row.id === updated.id ? { ...row, ...updated } : row
      );
      const optionsById = Object.fromEntries(
        options.map((row) => [row.id, row])
      );
      const cases = (current.cases || []).map((row) => {
        const uses = (row.slots || []).some(
          (slot) => slot.option_id === updated.id
        );
        if (!uses) return row;
        return { ...row, ...caseTotalsFromSlots(row.slots, optionsById) };
      });
      return { ...current, options, cases };
    });
  }

  function patchCase(updated) {
    setData((current) => {
      if (!current?.cases || !updated?.id) return current;
      return {
        ...current,
        cases: current.cases.map((row) =>
          row.id === updated.id ? { ...row, ...updated } : row
        ),
      };
    });
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }
  if (!data) {
    return <LoadingScreen message="Opening Mysterious Sale..." />;
  }

  return (
    <MysteriousSale
      data={data}
      onChange={refresh}
      onCaseUpdated={patchCase}
      onOptionUpdated={patchOption}
    />
  );
}
