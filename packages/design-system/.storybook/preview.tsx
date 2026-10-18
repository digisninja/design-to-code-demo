import type { Preview } from "@storybook/react";
import "../src/styles.css";

const preview: Preview = {
  decorators: [(Story) => <div className="ds-root"><Story /></div>],
  parameters: {
    controls: { expanded: true },
    // addon-a11y runs axe on every story; violations fail the story's a11y panel.
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
    options: { storySort: { order: ["Introduction", "Rules", "Tokens", "Components"] } },
  },
  tags: ["autodocs"],
};
export default preview;
