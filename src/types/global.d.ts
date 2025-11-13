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
    // The Pokemon library we're using that contains all pokemon data. Useful for debugging
    Dex?: Dex;
  }
}

export {};
