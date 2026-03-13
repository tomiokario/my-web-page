import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader";
import Footer from "./components/Footer";
import { appRoutes } from "./routes";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <Header />
          <SubHeader />
          <main
            style={{
              flex: "1",
              padding: "1rem",
            }}
          >
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1rem" }}>
              <Routes>
                {appRoutes.map((route) => (
                  <Route key={route.key} path={route.path} element={route.element} />
                ))}
              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
