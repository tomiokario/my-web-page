// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader"; // ベージュ帯コンポーネント
import Footer from "./components/Footer";

import Home from "./pages/Home";
import ProfileCV from "./pages/ProfileCV";
import Publications from "./pages/Publications";

function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <Router>
        <Header />
        <SubHeader /> {/* ここで灰色帯にページ名を表示 */}
        <main style={{ minHeight: "70vh", padding: "1rem" }}> {/* メインコンテンツの高さを最低70vhにする */}
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1rem" }}> {/* コンテンツを左右の中央に揃える */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile-cv" element={<ProfileCV />} />
              <Route path="/publications" element={<Publications />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </Router>
    </MantineProvider>
  );
}

export default App;
