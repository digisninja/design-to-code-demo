import type { Meta, StoryObj } from "@storybook/react";
import { docsPage } from "../docs/docsPage";
import { Input } from "./Input";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: { docs: { page: docsPage("Input") } },
  args: { label: "Email", type: "email", placeholder: "jane@example.com" },
  decorators: [(S) => <div style={{ maxWidth: 320 }}><S /></div>],
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHelper: Story = { args: { helperText: "We'll never share your email." } };
export const Invalid: Story = { args: { error: "Enter a valid email address." } };
export const Password: Story = { args: { label: "Password", type: "password", placeholder: undefined, defaultValue: "secret-value" } };
export const Disabled: Story = { args: { disabled: true } };
