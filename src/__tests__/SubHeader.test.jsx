import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import SubHeader from "../components/SubHeader";

// ラッパーアプローチを使用したテスト
describe("SubHeader component", () => {
  // Profile & CVページの場合のテスト
  test("displays correct page name for profile-cv path", () => {
    render(
      <MemoryRouter initialEntries={["/profile-cv"]}>
        <SubHeader />
      </MemoryRouter>
    );
    const headingElement = screen.getByText("Profile & Curriculum Vitae (CV)");
    expect(headingElement).toBeInTheDocument();
  });

  // ホームページの場合のテスト
  test("displays correct page name for home path", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <SubHeader />
      </MemoryRouter>
    );
    const headingElement = screen.getByText("冨岡 莉生 (TOMIOKA Rio)");
    expect(headingElement).toBeInTheDocument();
  });

  // Publicationsページの場合のテスト
  test("displays correct page name for publications path", () => {
    render(
      <MemoryRouter initialEntries={["/publications"]}>
        <SubHeader />
      </MemoryRouter>
    );
    const headingElement = screen.getByText("Publications");
    expect(headingElement).toBeInTheDocument();
  });

  // 未知のパスの場合のテスト
  test("does not render for unknown path", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/unknown"]}>
        <SubHeader />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });
});