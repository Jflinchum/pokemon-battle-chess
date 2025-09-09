declare module "*.css";
declare module "*.mp3";
declare module "*.ogg";
declare module "*.jpg";
declare module "*.png";

declare global {
  interface Window {
    gameSeed?: string;
  }
}

export {};
