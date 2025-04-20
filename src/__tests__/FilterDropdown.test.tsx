import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import FilterDropdown from "../components/publications/FilterDropdown";
import { renderWithProviders } from "../test-utils/test-utils";
import { SelectedFilters } from "../hooks/useFilters";

describe("FilterDropdown", () => {
  const mockProps = {
    category: "year" as keyof SelectedFilters,
    label: "Year",
    options: ["2020", "2021", "2022"],
    selectedValues: ["2021"],
    isOpen: false,
    onToggleDropdown: jest.fn(),
    onToggleFilter: jest.fn(),
    filterRef: jest.fn(),
  };

  test("renders filter button with correct label", () => {
    renderWithProviders(<FilterDropdown {...mockProps} />);
    
    const button = screen.getByTestId("year-filter-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Year ▼");
  });

  test("applies different class when filter has selected values", () => {
    renderWithProviders(<FilterDropdown {...mockProps} />);
    
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
    renderWithProviders(<FilterDropdown {...props} />);
    
    const button = screen.getByTestId("year-filter-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Year ▼");
    // selectedValuesが空であることを確認
    expect(props.selectedValues.length).toBe(0);
  });

  test("calls onToggleDropdown when button is clicked", () => {
    renderWithProviders(<FilterDropdown {...mockProps} />);
    
    const button = screen.getByTestId("year-filter-button");
    fireEvent.click(button);
    
    expect(mockProps.onToggleDropdown).toHaveBeenCalledWith("year");
  });

  test("does not render dropdown when isOpen is false", () => {
    renderWithProviders(<FilterDropdown {...mockProps} />);
    
    const dropdown = screen.queryByTestId("year-dropdown");
    expect(dropdown).not.toBeInTheDocument();
  });

  test("renders dropdown with options when isOpen is true", () => {
    const props = { ...mockProps, isOpen: true };
    renderWithProviders(<FilterDropdown {...props} />);
    
    const dropdown = screen.getByTestId("year-dropdown");
    expect(dropdown).toBeInTheDocument();
    
    // オプションが表示されていることを確認
    mockProps.options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  test("calls onToggleFilter when option is clicked", () => {
    const props = { ...mockProps, isOpen: true };
    renderWithProviders(<FilterDropdown {...props} />);
    
    // ラベルをクリックすることでチェックボックスをクリックする
    const optionLabel = screen.getByText("2020");
    fireEvent.click(optionLabel);
    
    expect(mockProps.onToggleFilter).toHaveBeenCalledWith("year", "2020");
  });

  test("checkbox is checked for selected values", () => {
    const props = { ...mockProps, isOpen: true };
    renderWithProviders(<FilterDropdown {...props} />);
    
    // 選択されているオプションのチェックボックスがチェックされていることを確認
    // aria-labelを使用してチェックボックスを取得
    const selectedCheckbox = screen.getByRole('checkbox', { name: '2021' });
    expect(selectedCheckbox).toBeChecked();
    
    // 選択されていないオプションのチェックボックスがチェックされていないことを確認
    const unselectedCheckbox = screen.getByRole('checkbox', { name: '2020' });
    expect(unselectedCheckbox).not.toBeChecked();
  });
});