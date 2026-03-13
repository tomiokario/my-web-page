import React from "react";
import { useNavigate, NavigateFunction } from "react-router-dom";
import { Button } from "@mantine/core";
import MarkdownPage from "../components/MarkdownPage";
import useLocale from "../hooks/useLocale";

function ComputerSystem2025() {
  const navigate: NavigateFunction = useNavigate();
  const t = useLocale();

  return (
    <MarkdownPage
      markdownPath="/markdown/works/computer-system-2025.md"
      footer={
        <div style={{ marginTop: "2rem" }}>
          <Button
            variant="default"
            onClick={() => navigate("/works")}
          >
            {t.common.backToWorks}
          </Button>
        </div>
      }
    />
  );
}

export default ComputerSystem2025;
