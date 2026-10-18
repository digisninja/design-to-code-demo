import type { Meta, StoryObj } from "@storybook/react";
import { docsPage } from "../docs/docsPage";
import { Alert } from "./Alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: { docs: { page: docsPage("Alert") } },
  args: { tone: "info", title: "Heads up", children: "Maintenance is scheduled for Sunday 02:00 UTC." },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Success: Story = { args: { tone: "success", title: "Saved", children: "Your changes are live." } };
export const Warning: Story = { args: { tone: "warning", title: "Almost full", children: "You've used 90% of your storage." } };
export const Critical: Story = { args: { tone: "error", title: "Payment failed", children: "Update your card to keep your plan." } };
