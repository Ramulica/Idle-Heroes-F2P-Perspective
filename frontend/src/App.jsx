import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api";
import { AuthContext } from "./auth";
import Home from "./pages/Home.jsx";
import MysteriousSale from "./pages/MysteriousSale.jsx";
import SgCalculator from "./pages/SgCalculator.jsx";
import AuthPage from "./pages/AuthPage.jsx";

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
    return <div className="loading">Opening the F2P archives...</div>;
  }
  if (!user) {
    return <AuthPage onAuth={setUser} />;
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/guides/sg-calculator" element={<SgCalculator />} />
        <Route path="/guides/mysterious-sale" element={<MysteriousSaleGate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
    return <div className="loading">Opening the F2P archives...</div>;
  }

  return <MysteriousSale data={data} onChange={refresh} />;
}
