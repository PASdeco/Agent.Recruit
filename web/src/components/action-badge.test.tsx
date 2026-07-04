import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionBadge } from "./action-badge";

describe("ActionBadge", () => {
  it("does not render a badge for signature actions", () => {
    const { container } = render(<ActionBadge kind="sign" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders AUTOMATED for relayer actions", () => {
    render(<ActionBadge kind="automated" />);
    expect(screen.getByText("AUTOMATED")).toBeInTheDocument();
  });
});
