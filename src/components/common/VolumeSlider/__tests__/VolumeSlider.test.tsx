import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VolumeSlider, VolumeSliderProps } from "../VolumeSlider";

const setup = (props: VolumeSliderProps = {}) => {
  const utils = render(<VolumeSlider {...props} />);
  const input = screen.getByTestId("volume-slider-input");
  const icon = screen.getByTestId("volume-slider-icon");

  return {
    input,
    icon,
    ...utils,
  };
};

describe("VolumeSlider", () => {
  it("should render a range input and volume icon", () => {
    const { input, icon } = setup();
    expect(icon).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
    expect(icon.role).toBe("img");
  });

  it("should trigger onVolumeUpdate after a debounce timer when the input is changed", () => {
    vi.useFakeTimers();
    const onVolumeUpdateMock = vi.fn();
    const { input } = setup({ onVolumeUpdate: onVolumeUpdateMock });
    fireEvent.change(input, { target: { value: 50 } });
    expect(onVolumeUpdateMock).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onVolumeUpdateMock).toHaveBeenCalledWith(50);

    fireEvent.change(input, { target: { value: 25 } });
    vi.runAllTimers();
    expect(onVolumeUpdateMock).toHaveBeenCalledWith(25);
  });

  it("should trigger onVolumeUpdate with a 0 after a debounce timer when the volume icon is clicked", () => {
    vi.useFakeTimers();
    const onVolumeUpdateMock = vi.fn();
    const { icon } = setup({ onVolumeUpdate: onVolumeUpdateMock });
    fireEvent.click(icon);
    expect(onVolumeUpdateMock).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onVolumeUpdateMock).toHaveBeenCalledWith(0);
  });

  it("should default the initial volume to 100", () => {
    const { input } = setup();
    expect(input).toHaveValue("100");
  });

  it("should change the initial volume based on the given prop", () => {
    const { input } = setup({ initialVolume: 45 });
    expect(input).toHaveValue("45");
  });

  it("should render a high volume icon with values above 50", () => {
    const { icon } = setup({ initialVolume: 51 });
    expect(icon).toHaveAttribute("data-icon", "volume-high");
  });

  it("should render a low volume icon with values 50 or below", () => {
    const { icon } = setup({ initialVolume: 50 });
    expect(icon).toHaveAttribute("data-icon", "volume-low");
  });

  it("should render a muted volume icon with value of 0", () => {
    const { icon } = setup({ initialVolume: 0 });
    expect(icon).toHaveAttribute("data-icon", "volume-xmark");
  });
});
