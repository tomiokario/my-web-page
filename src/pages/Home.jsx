import React from "react";
import homeData from "../data/homeContent.json";

function Home() {
  const { affiliation, lab, contact, accounts } = homeData;

  return (
    <div style={{ padding: "0rem" }}>
      <section>
        <h3>Affiliation</h3>
        <p>{affiliation}</p>
        <p>{lab}</p>
      </section>

      <section>
        <h3>Contact</h3>
        <p>Mail 1: {contact.mail1}</p>
        <p>Mail 2: {contact.mail2}</p>
      </section>

      <section>
        <h3>Accounts</h3>
        <p>GitHub: {accounts.github}</p>
        <p>Google Scholar: {accounts.googleScholar}</p>
      </section>
    </div>
  );
}

export default Home;
