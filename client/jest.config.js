module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '\\.scss$': 'identity-obj-proxy',
    // Use axios's CJS build for Jest (avoids ESM import parsing errors)
    '^axios$': 'axios/dist/node/axios.cjs'
  },
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
  },
  // Ensure node_modules does not contain untranspiled ESM that breaks Jest;
  // we explicitly map axios above, but keep a safe transform rule.
  transformIgnorePatterns: ['/node_modules/(?!(axios)/)'],
};