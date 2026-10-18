import type { Meta, StoryObj } from "@storybook/react";
import { docsPage } from "../docs/docsPage";
import { Button } from "./Button";
import { Card } from "./Card";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: { docs: { page: docsPage("Card") } },
  args: { title: "Current plan", children: "You're on the Free plan. Upgrade for unlimited projects." },
  decorators: [(S) => <div style={{ maxWidth: 400 }}><S /></div>],
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="secondary">Not now</Button>
        <Button>Upgrade</Button>
      </>
    ),
  },
};
