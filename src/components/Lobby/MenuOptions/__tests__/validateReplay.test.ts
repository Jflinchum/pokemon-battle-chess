import { describe, it, expect } from "vitest";
import { validateReplay } from "../validateReplay";
import { getMockReplayData } from "../../../../testUtils/matchHistory";
import { ReplayData } from "../../../../util/downloadReplay";

describe("validateReplay", () => {
  describe("Valid Cases", () => {
    it("should return true for valid replay data", () => {
      const validReplayData = getMockReplayData();
      expect(validateReplay(validReplayData)).toBe(true);
    });

    it("should return true for valid replay with extra, unnecessary fields", () => {
      const validReplayData = {
        ...getMockReplayData(),
        extraField: "extra data",
      };
      expect(validateReplay(validReplayData)).toBe(true);
    });
  });

  describe("Missing Required Fields", () => {
    it("should return false when players is missing", () => {
      const invalidReplayData = getMockReplayData();
      delete (invalidReplayData as Partial<ReplayData>).players;
      expect(validateReplay(invalidReplayData)).toBe(false);
    });

    it("should return false when options is missing", () => {
      const invalidReplayData = getMockReplayData();
      delete (invalidReplayData as Partial<ReplayData>).options;
      expect(validateReplay(invalidReplayData)).toBe(false);
    });

    it("should return false when seed is missing", () => {
      const invalidReplayData = getMockReplayData();
      delete (invalidReplayData as Partial<ReplayData>).seed;
      expect(validateReplay(invalidReplayData)).toBe(false);
    });

    it("should return false when matchHistory is missing", () => {
      const invalidReplayData = getMockReplayData();
      delete (invalidReplayData as Partial<ReplayData>).matchHistory;
      expect(validateReplay(invalidReplayData)).toBe(false);
    });
  });

  describe("Empty Arrays", () => {
    it("should return false when players array is empty", () => {
      const invalidReplayData = {
        ...getMockReplayData(),
        players: [],
      };
      expect(validateReplay(invalidReplayData)).toBe(false);
    });

    it("should return false when matchHistory array is empty", () => {
      const invalidReplayData = {
        ...getMockReplayData(),
        matchHistory: [],
      };
      expect(validateReplay(invalidReplayData)).toBe(false);
    });
  });

  describe("Player Color Validation", () => {
    it("should return false when white player is missing", () => {
      const invalidReplayData = getMockReplayData();
      invalidReplayData.players = invalidReplayData.players.filter(
        (player) => player.color !== "w",
      );
      expect(validateReplay(invalidReplayData)).toBe(false);
    });

    it("should return false when black player is missing", () => {
      const invalidReplayData = getMockReplayData();
      invalidReplayData.players = invalidReplayData.players.filter(
        (player) => player.color !== "b",
      );
      expect(validateReplay(invalidReplayData)).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should return false for null input", () => {
      expect(validateReplay(null as unknown as ReplayData)).toBe(false);
    });

    it("should return false for undefined input", () => {
      expect(validateReplay(undefined as unknown as ReplayData)).toBe(false);
    });

    it("should return false for malformed data", () => {
      const malformedData = {
        players: null,
        options: undefined,
        seed: 123,
        matchHistory: "not an array",
      } as unknown as ReplayData;
      expect(validateReplay(malformedData)).toBe(false);
    });
  });
});
