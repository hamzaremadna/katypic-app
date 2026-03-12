module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@theme": "./src/theme",
            "@hooks": "./src/hooks",
            "@services": "./src/services",
            "@stores": "./src/stores",
            "@types": "./src/types",
          },
        },
      ],
      "react-native-reanimated/plugin", // must be last
    ],
  };
};
