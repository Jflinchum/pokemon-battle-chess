import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Carousal, CarousalProps } from "../Carousal";

const mockScreens = [
  <div key="1">Screen 1</div>,
  <div key="2">Screen 2</div>,
  <div key="3">Screen 3</div>,
];

const setup = (props: CarousalProps = { screens: mockScreens }) => {
  const utils = render(<Carousal {...props} />);
  const prevButton = screen.getByTestId("carousal-previous-button");
  const nextButton = screen.getByTestId("carousal-next-button");
  const screenSelectors = screen.getAllByTestId(
    "carousal-screen-selector-button",
  );

  return {
    prevButton,
    nextButton,
    screenSelectors,
    ...utils,
  };
};

describe("Carousal", () => {
  it("should render first screen by default", () => {
    setup();
    expect(screen.getByText("Screen 1")).toBeInTheDocument();
    expect(screen.queryByText("Screen 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Screen 3")).not.toBeInTheDocument();
  });

  describe("when not wrapping screens", () => {
    it("should disable the previous button on the first screen", () => {
      const { prevButton, nextButton } = setup({ screens: mockScreens });
      expect(prevButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("should disable the next button on the last screen", () => {
      const { prevButton, nextButton } = setup({ screens: mockScreens });

      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(nextButton).toBeDisabled();
      expect(prevButton).not.toBeDisabled();
    });

    it("should navigate forward and backward through screens", () => {
      const { nextButton, prevButton } = setup({ screens: mockScreens });

      fireEvent.click(nextButton);
      expect(screen.getByText("Screen 2")).toBeInTheDocument();
      fireEvent.click(nextButton);
      expect(screen.getByText("Screen 3")).toBeInTheDocument();

      fireEvent.click(prevButton);
      expect(screen.getByText("Screen 2")).toBeInTheDocument();
      fireEvent.click(prevButton);
      expect(screen.getByText("Screen 1")).toBeInTheDocument();
    });
  });

  describe("when wrapping screens", () => {
    it("should enable both buttons always", () => {
      const { prevButton, nextButton } = setup({
        screens: mockScreens,
        wrapScreens: true,
      });

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();

      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("should wrap from last to first screen when clicking next", () => {
      const { nextButton } = setup({
        screens: mockScreens,
        wrapScreens: true,
      });

      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(screen.getByText("Screen 1")).toBeInTheDocument();
    });

    it("should wrap from first to last screen when clicking previous", () => {
      const { prevButton } = setup({
        screens: mockScreens,
        wrapScreens: true,
      });

      fireEvent.click(prevButton);

      expect(screen.getByText("Screen 3")).toBeInTheDocument();
    });
  });

  describe("screen selector buttons", () => {
    it("should render correct number of screen selectors", () => {
      const { screenSelectors } = setup();
      expect(screenSelectors).toHaveLength(mockScreens.length);
    });

    it("should navigate to correct screen when selector is clicked", () => {
      const { screenSelectors } = setup();

      fireEvent.click(screenSelectors[1]);
      expect(screen.getByText("Screen 2")).toBeInTheDocument();

      fireEvent.click(screenSelectors[2]);
      expect(screen.getByText("Screen 3")).toBeInTheDocument();

      fireEvent.click(screenSelectors[0]);
      expect(screen.getByText("Screen 1")).toBeInTheDocument();
    });

    it("should apply active class to current screen selector", () => {
      const { screenSelectors, nextButton } = setup();

      expect(
        screenSelectors[0].querySelector(".carousalScreenSelectorActive"),
      ).toBeInTheDocument();

      fireEvent.click(nextButton);
      expect(
        screenSelectors[1].querySelector(".carousalScreenSelectorActive"),
      ).toBeInTheDocument();
    });
  });
});
