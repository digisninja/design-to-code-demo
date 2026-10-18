import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: { name: "@storybook/react-vite", options: {} },
  docs: { defaultName: "Docs" },
  // Screens in /examples sit outside the Vite root, so plugin-react skips them and
  // esbuild falls back to classic JSX ("React is not defined"). Force the automatic runtime.
  viteFinal: (config) => ({ ...config, esbuild: { ...config.esbuild, jsx: "automatic" } }),
};
export default config;
