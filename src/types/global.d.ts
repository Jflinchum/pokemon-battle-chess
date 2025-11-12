import { Dex } from "@pkmn/dex";

declare module "*.css";
declare module "*.mp3";
declare module "*.ogg";
declare module "*.jpg";
declare module "*.png";

declare global {
  interface Window {
    // Current game seed in a match. Useful for debugging
    gameSeed?: string;
    // A reference to the chess web worker we instantiate for the stockfish AI. Useful for saving memory and re-using that resource
    chessWorker?: Worker;
    // A reference to the chess web worker we instantiate for the stockfish AI. Useful for saving memory and re-using that resource
    stockfishEventListener?: (e: MessageEvent) => void;
    // The Pokemon library we're using that contains all pokemon data. Useful for debugging
    Dex?: Dex;
  }
}

export {};
