module.exports = {
    globals: {},
    testEnvironment: "node",
    testRegex: "/tests/.*\.(test|integration|accept)\.(ts|tsx)$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    coverageDirectory: "./.cover",
    collectCoverageFrom: [
        "<rootDir>/src/**/*.(ts)",
        "!<rootDir>/src/**/index.ts"
    ],
    coverageThreshold: {
        //...Object.assign({}, ...handlerRules),
        // "global": {
        //     "branches": 90,
        //     "functions": 90,
        //     "lines": 90,
        //     "statements": 90
        // }
    }
};
