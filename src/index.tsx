// src/index.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { MantineEmotionProvider, emotionTransform } from "@mantine/emotion";
import '@mantine/core/styles.css';
import App from "./App";
import "./styles/variables.css";
import "./styles/styles.css";
import { mantineCache } from "./mantineEmotionCache";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <MantineEmotionProvider cache={mantineCache}>
      <MantineProvider stylesTransform={emotionTransform}>
        <App />
      </MantineProvider>
    </MantineEmotionProvider>
  </React.StrictMode>
);
