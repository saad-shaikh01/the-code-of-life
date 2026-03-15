import { render, screen } from "@testing-library/react";
import { CipherTokenCell } from "@/modules/puzzles/components/CipherTokenCell";

describe("CipherTokenCell", () => {
  it("renders a numeric token as visible cell content", () => {
    render(<CipherTokenCell token="1" />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders edge-case punctuation tokens without crashing", () => {
    render(<CipherTokenCell token="27" />);

    expect(screen.getByText("27")).toBeInTheDocument();
  });

  it("renders an empty token as a spacer element", () => {
    const { container } = render(<CipherTokenCell token="" />);

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("renders a hidden token placeholder when requested", () => {
    render(<CipherTokenCell token="1" hidden />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
