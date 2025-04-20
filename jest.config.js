module.exports = {
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.tsx",
    "!src/reportWebVitals.ts",
    "!src/setupTests.ts",
    "!src/__tests__/**",
    "!src/test-utils/**"
  ],
  // moduleNameMapper は不要になったため削除
  // create-react-app のデフォルト設定は react-scripts によって内部的に適用されるため、
  // ここで preset や testEnvironment を明示的に指定する必要は通常ありません。
};