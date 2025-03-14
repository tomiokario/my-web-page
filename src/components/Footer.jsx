import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}> {/* コンテンツを左右の中央に揃える */}
        <p>&copy; 2025 TOMIOKA Rio</p>
      </div>
    </footer>
  );
}

export default Footer;
