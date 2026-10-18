import { Controls, Description, Primary, Stories, Subtitle, Title } from "@storybook/blocks";
import { SpecPanel } from "./SpecPanel";

/** Standard autodocs page plus the shared requirements/rules panel. */
export const docsPage = (name: string) => () => (
  <>
    <Title />
    <Subtitle />
    <Description />
    <Primary />
    <Controls />
    <SpecPanel name={name} />
    <Stories />
  </>
);
