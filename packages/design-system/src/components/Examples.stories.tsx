import type { Meta, StoryObj } from "@storybook/react";
import { SettingsPage } from "../../../../examples/SettingsPage";

const meta = { title: "Examples/Settings page", component: SettingsPage, tags: ["!autodocs"] } satisfies Meta<typeof SettingsPage>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
