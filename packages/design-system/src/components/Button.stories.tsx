import type { Meta, StoryObj } from "@storybook/react";
import { docsPage } from "../docs/docsPage";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    docs: { page: docsPage("Button"), description: { component: "Triggers an action. One primary button per view." } },
  },
  args: { children: "Save changes", variant: "primary", size: "md" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Cancel" } };
export const Danger: Story = { args: { variant: "danger", children: "Delete project" } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="md">Medium</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  ),
};
export const IconOnly: Story = {
  args: { children: undefined, icon: "✕", "aria-label": "Close dialog", variant: "secondary" },
};
