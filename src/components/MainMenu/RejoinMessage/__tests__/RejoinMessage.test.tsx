import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RejoinMessage, RejoinMessageProps } from "../RejoinMessage";

const setup = (props: Partial<RejoinMessageProps> = {}) => {
  const yesClickMock = vi.fn();
  const noClickMock = vi.fn();
  const closeToastMock = vi.fn();
  const utils = render(
    <RejoinMessage
      data={{
        onYesClick: yesClickMock,
        onNoClick: noClickMock,
      }}
      closeToast={closeToastMock}
      {...props}
    />,
  );

  const yesButton = screen.getByTestId("rejoin-message-yes-button");
  const noButton = screen.getByTestId("rejoin-message-no-button");

  return {
    yesButton,
    noButton,
    yesClickMock,
    noClickMock,
    closeToastMock,
    ...utils,
  };
};

describe("RejoinMessage", () => {
  describe("Rendering", () => {
    it("should render both a Yes and No button", () => {
      const { yesButton, noButton } = setup();
      expect(yesButton).toBeInTheDocument();
      expect(yesButton).toBeEnabled();
      expect(noButton).toBeInTheDocument();
      expect(noButton).toBeEnabled();
    });
  });

  describe("Event handling", () => {
    it("should trigger data.onYesClick and closeToast when the yes button is clicked", async () => {
      const { yesButton, yesClickMock, closeToastMock } = setup();

      expect(yesClickMock).not.toHaveBeenCalled();
      expect(closeToastMock).not.toHaveBeenCalled();

      await userEvent.click(yesButton);

      expect(yesClickMock).toHaveBeenCalledOnce();
      expect(closeToastMock).toHaveBeenCalledOnce();
    });

    it("should trigger data.onNoClick and closeToast when the no button is clicked", async () => {
      const { noButton, noClickMock, closeToastMock } = setup();

      expect(noClickMock).not.toHaveBeenCalled();
      expect(closeToastMock).not.toHaveBeenCalled();

      await userEvent.click(noButton);

      expect(noClickMock).toHaveBeenCalledOnce();
      expect(closeToastMock).toHaveBeenCalledOnce();
    });
  });
});
