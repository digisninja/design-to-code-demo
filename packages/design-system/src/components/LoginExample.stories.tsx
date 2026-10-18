import type { Meta, StoryObj } from "@storybook/react";
import { LoginPage } from "../../../../examples/LoginPage";

const meta = { title: "Examples/Login page", component: LoginPage, tags: ["!autodocs"] } satisfies Meta<typeof LoginPage>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
