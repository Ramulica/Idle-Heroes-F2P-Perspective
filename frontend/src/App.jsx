import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api, subscribePending } from "./api";
import { AuthContext } from "./auth";
import { LoadingOverlay, LoadingScreen } from "./components/LoadingSpinner.jsx";
import Home from "./pages/Home.jsx";
import MysteriousSale from "./pages/MysteriousSale.jsx";
import SgCalculator from "./pages/SgCalculator.jsx";
import AuthPage from "./pages/AuthPage.jsx";

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
      .then((result) => setUser(result.user))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await api.logout();
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

  async function refresh() {
    const next = await api.bootstrap();
    setData(next);
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

  return <MysteriousSale data={data} onChange={refresh} />;
}
