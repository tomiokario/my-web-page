// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { LanguageProvider } from "./contexts/LanguageContext";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader"; // ベージュ帯コンポーネント
import Footer from "./components/Footer";

import Home from "./pages/Home";
import ProfileCV from "./pages/ProfileCV";
import Publications from "./pages/Publications";
import Works from "./pages/Works";
import ComputerSystem2025 from "./pages/ComputerSystem2025";

function App() {
  return (
    <MantineProvider>
      <LanguageProvider>
        <Router>
          {/* Flexboxを使用して、ページ全体を縦方向に配置 */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh" /* ページの高さを最低でもビューポートの高さに設定 */
          }}>
            <Header />
            <SubHeader /> {/* ここで灰色帯にページ名を表示 */}
            <main style={{
              flex: "1", /* 利用可能なスペースをすべて使用 */
              padding: "1rem"
            }}>
              <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1rem" }}> {/* コンテンツを左右の中央に揃える */}
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/profile-cv" element={<ProfileCV />} />
                  <Route path="/publications" element={<Publications />} />
                  <Route path="/works" element={<Works />} />
                  <Route path="/works/computer-system-2025" element={<ComputerSystem2025 />} />
                </Routes>
              </div>
            </main>
            <Footer />
          </div>
        </Router>
      </LanguageProvider>
    </MantineProvider>
  );
}

export default App;
