import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Timer, { TimerProps } from "../Timer";

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = (props: Partial<TimerProps> = {}) => {
    const baseProps = {
      timerExpiration: new Date().getTime() + 5 * 60 * 1000,
      paused: false,
      roundUpRenderedTime: false,
      ...props,
    };

    return render(<Timer {...baseProps} />);
  };

  describe("Time format", () => {
    it("should format time in MM:SS format when over a minute", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime + 2 * 60 * 1000,
      });

      expect(screen.getByText("2:00")).toBeInTheDocument();
    });

    it("should format time in SS.mm format when under a minute", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime + 45 * 1000,
      });

      expect(screen.getByText("45.00")).toBeInTheDocument();
    });

    it("should show 0:00 when time is expired", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime - 1000,
      });

      expect(screen.getByText("0:00")).toBeInTheDocument();
    });

    it("should pad seconds with leading zero", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime + 65 * 1000,
      });

      expect(screen.getByText("1:05")).toBeInTheDocument();
    });
  });

  describe("Timer Updates", () => {
    it("should update every second when over a minute", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime + 2 * 60 * 1000,
      });

      expect(screen.getByText("2:00")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("1:59")).toBeInTheDocument();
    });

    it("should update every 10ms when under a minute", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime + 45 * 1000,
      });

      expect(screen.getByText("45.00")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(10);
      });
      expect(screen.getByText("44.99")).toBeInTheDocument();
    });

    it("should switch to 10ms updates when crossing the 1-minute threshold", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime + 61 * 1000,
      });

      expect(screen.getByText("1:01")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("1:00")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(10);
      });
      expect(screen.getByText("59.99")).toBeInTheDocument();
    });
  });

  describe("Pausing", () => {
    it("should not update time when paused", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime + 30 * 1000,
        paused: true,
      });

      const initialTime = screen.getByText("30.00");
      expect(initialTime).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("30.00")).toBeInTheDocument();
    });

    it("should have paused class when paused", () => {
      setup({ paused: true });
      expect(screen.getByTestId("timer")).toHaveClass("paused");
    });
  });

  describe("Rounding Up", () => {
    it("should round up to nearest second when roundUpRenderedTime is true", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime + 30500,
        roundUpRenderedTime: true,
      });

      expect(screen.getByText("31.00")).toBeInTheDocument();
    });

    it("should not round up when roundUpRenderedTime is false", () => {
      const testTime = new Date(2025, 0, 1, 12, 0, 0).getTime();
      vi.setSystemTime(testTime);

      setup({
        timerExpiration: testTime + 30500,
        roundUpRenderedTime: false,
      });

      expect(screen.getByText("30.50")).toBeInTheDocument();
    });
  });
});
