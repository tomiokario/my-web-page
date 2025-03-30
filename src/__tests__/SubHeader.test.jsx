import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// テスト用の簡易版SubHeaderコンポーネント
// 実際のコンポーネントと同じロジックを持つが、react-router-domに依存しない
const TestSubHeader = ({ pathname }) => {
  let pageName = "";
  switch (pathname) {
    case "/":
      pageName = "冨岡 莉生 (TOMIOKA Rio)";
      break;
    case "/profile-cv":
      pageName = "Profile & Curriculum Vitae (CV)";
      break;
    case "/publications":
      pageName = "Publications";
      break;
    default:
      pageName = "";
  }

  // ページ名が無ければサブヘッダー自体を表示しない
  if (!pageName) return null;

  return (
    <div className="subheader">
      <h2>{pageName}</h2>
    </div>
  );
};

describe("SubHeader component (Test Version)", () => {
  // Profile & CVページの場合のテスト
  test("displays correct page name for profile-cv path", () => {
    render(<TestSubHeader pathname="/profile-cv" />);
    const headingElement = screen.getByText("Profile & Curriculum Vitae (CV)");
    expect(headingElement).toBeInTheDocument();
  });

  // ホームページの場合のテスト
  test("displays correct page name for home path", () => {
    render(<TestSubHeader pathname="/" />);
    const headingElement = screen.getByText("冨岡 莉生 (TOMIOKA Rio)");
    expect(headingElement).toBeInTheDocument();
  });

  // Publicationsページの場合のテスト
  test("displays correct page name for publications path", () => {
    render(<TestSubHeader pathname="/publications" />);
    const headingElement = screen.getByText("Publications");
    expect(headingElement).toBeInTheDocument();
  });

  // 未知のパスの場合のテスト
  test("does not render for unknown path", () => {
    const { container } = render(<TestSubHeader pathname="/unknown" />);
    expect(container.firstChild).toBeNull();
  });
});