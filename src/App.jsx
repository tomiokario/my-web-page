// src/App.jsx (例)
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader"; // ベージュ帯コンポーネント
import Footer from "./components/Footer";

import Home from "./pages/Home";
import ProfileCV from "./pages/ProfileCV";
import Publications from "./pages/Publications";

function App() {
  return (
    <Router>
      <Header />
      <SubHeader /> {/* ここでベージュ色帯にページ名を表示 */}
      <main style={{ minHeight: "70vh", padding: "1rem" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile-cv" element={<ProfileCV />} />
          <Route path="/publications" element={<Publications />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;

