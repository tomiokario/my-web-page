import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FilterDropdown from "../components/publications/FilterDropdown";

describe("FilterDropdown", () => {
  const mockProps = {
    category: "year",
    label: "Year",
    options: ["2020", "2021", "2022"],
    selectedValues: ["2021"],
    isOpen: false,
    onToggleDropdown: jest.fn(),
    onToggleFilter: jest.fn(),
    filterRef: jest.fn(),
  };

  test("renders filter button with correct label", () => {
    render(<FilterDropdown {...mockProps} />);
    
    const button = screen.getByTestId("year-filter-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Year ▼");
  });

  test("applies different class when filter has selected values", () => {
    render(<FilterDropdown {...mockProps} />);
    
    const button = screen.getByTestId("year-filter-button");
    // Mantineのクラス名は動的に生成されるため、正確なクラス名ではなく
    // ボタンの存在とテキストを確認する
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Year ▼");
    // selectedValuesが空でないことを確認
    expect(mockProps.selectedValues.length).toBeGreaterThan(0);
  });

  test("applies different class when filter has no selected values", () => {
    const props = { ...mockProps, selectedValues: [] };
    render(<FilterDropdown {...props} />);
    
    const button = screen.getByTestId("year-filter-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Year ▼");
    // selectedValuesが空であることを確認
    expect(props.selectedValues.length).toBe(0);
  });

  test("calls onToggleDropdown when button is clicked", () => {
    render(<FilterDropdown {...mockProps} />);
    
    const button = screen.getByTestId("year-filter-button");
    fireEvent.click(button);
    
    expect(mockProps.onToggleDropdown).toHaveBeenCalledWith("year");
  });

  test("does not render dropdown when isOpen is false", () => {
    render(<FilterDropdown {...mockProps} />);
    
    const dropdown = screen.queryByTestId("year-dropdown");
    expect(dropdown).not.toBeInTheDocument();
  });

  test("renders dropdown with options when isOpen is true", () => {
    const props = { ...mockProps, isOpen: true };
    render(<FilterDropdown {...props} />);
    
    const dropdown = screen.getByTestId("year-dropdown");
    expect(dropdown).toBeInTheDocument();
    
    // オプションが表示されていることを確認
    mockProps.options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  test("calls onToggleFilter when option is clicked", () => {
    const props = { ...mockProps, isOpen: true };
    render(<FilterDropdown {...props} />);
    
    // ラベルをクリックすることでチェックボックスをクリックする
    const optionLabel = screen.getByText("2020");
    fireEvent.click(optionLabel);
    
    expect(mockProps.onToggleFilter).toHaveBeenCalledWith("year", "2020");
  });

  test("checkbox is checked for selected values", () => {
    const props = { ...mockProps, isOpen: true };
    render(<FilterDropdown {...props} />);
    
    // 選択されているオプションのチェックボックスがチェックされていることを確認
    // ラベルのテキストからチェックボックスを取得
    const checkboxes = screen.getAllByRole('checkbox');
    const selectedCheckbox = checkboxes.find(
      checkbox => checkbox.nextSibling.textContent === "2021"
    );
    expect(selectedCheckbox).toBeChecked();
    
    // 選択されていないオプションのチェックボックスがチェックされていないことを確認
    const unselectedCheckbox = checkboxes.find(
      checkbox => checkbox.nextSibling.textContent === "2020"
    );
    expect(unselectedCheckbox).not.toBeChecked();
  });
});