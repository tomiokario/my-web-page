import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActiveFilters from "../components/publications/ActiveFilters";

describe("ActiveFilters", () => {
  const mockProps = {
    selectedFilters: {
      year: ["2021", "2022"],
      authorship: ["First author"],
      type: [],
      review: [],
      presentationType: []
    },
    filterLabels: {
      year: "Year",
      authorship: "Authorship",
      type: "Type",
      review: "Review",
      presentationType: "Presentation Type"
    },
    onToggleFilter: jest.fn(),
    onResetFilters: jest.fn(),
    resetLabel: "Reset Filters"
  };

  test("renders reset button with correct label", () => {
    render(<ActiveFilters {...mockProps} />);
    
    const resetButton = screen.getByTestId("reset-filters-button");
    expect(resetButton).toBeInTheDocument();
    expect(resetButton).toHaveTextContent("Reset Filters");
  });

  test("calls onResetFilters when reset button is clicked", () => {
    render(<ActiveFilters {...mockProps} />);
    
    const resetButton = screen.getByTestId("reset-filters-button");
    fireEvent.click(resetButton);
    
    expect(mockProps.onResetFilters).toHaveBeenCalled();
  });

  test("renders active filters container", () => {
    render(<ActiveFilters {...mockProps} />);
    
    const activeFiltersContainer = screen.getByTestId("active-filters");
    expect(activeFiltersContainer).toBeInTheDocument();
  });

  test("renders filter categories with labels", () => {
    render(<ActiveFilters {...mockProps} />);
    
    // 選択されているフィルターのカテゴリラベルが表示されていることを確認
    expect(screen.getByText("Year:")).toBeInTheDocument();
    expect(screen.getByText("Authorship:")).toBeInTheDocument();
    
    // 選択されていないフィルターのカテゴリラベルが表示されていないことを確認
    expect(screen.queryByText("Type:")).not.toBeInTheDocument();
    expect(screen.queryByText("Review:")).not.toBeInTheDocument();
    expect(screen.queryByText("Presentation Type:")).not.toBeInTheDocument();
  });

  test("renders filter tags for selected values", () => {
    render(<ActiveFilters {...mockProps} />);
    
    // 選択されているフィルター値がタグとして表示されていることを確認
    expect(screen.getByTestId("filter-tag-year-2021")).toBeInTheDocument();
    expect(screen.getByTestId("filter-tag-year-2022")).toBeInTheDocument();
    expect(screen.getByTestId("filter-tag-authorship-First author")).toBeInTheDocument();
    
    // タグのテキストが正しいことを確認
    expect(screen.getByTestId("filter-tag-year-2021")).toHaveTextContent("2021 ✕");
    expect(screen.getByTestId("filter-tag-year-2022")).toHaveTextContent("2022 ✕");
    expect(screen.getByTestId("filter-tag-authorship-First author")).toHaveTextContent("First author ✕");
  });

  test("calls onToggleFilter when filter tag is clicked", () => {
    render(<ActiveFilters {...mockProps} />);
    
    const filterTag = screen.getByTestId("filter-tag-year-2021");
    fireEvent.click(filterTag);
    
    expect(mockProps.onToggleFilter).toHaveBeenCalledWith("year", "2021");
  });

  test("does not render anything when no filters are selected", () => {
    const props = {
      ...mockProps,
      selectedFilters: {
        year: [],
        authorship: [],
        type: [],
        review: [],
        presentationType: []
      }
    };
    
    const { container } = render(<ActiveFilters {...props} />);
    
    // コンポーネントが何も描画しないことを確認
    expect(container).toBeEmptyDOMElement();
  });
});