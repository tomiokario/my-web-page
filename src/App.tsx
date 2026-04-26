import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "./components/Header";
import SubHeader from "./components/SubHeader";
import Footer from "./components/Footer";
import { appRoutes } from "./routes";

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
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
              <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 1rem" }}>
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
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
