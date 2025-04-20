module.exports = {
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|vfile|unist|unified|bail|is-plain-obj|trough|remark|mdast|micromark|decode-named-character-reference|character-entities|property-information|hast|space-separated-tokens|comma-separated-tokens|estree-walker)/)'
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};