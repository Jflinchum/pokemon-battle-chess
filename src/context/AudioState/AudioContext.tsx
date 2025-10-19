import { createContext, useContext } from "react";

export const audioTracks = { global: new Audio(), battle: new Audio() };

export const AudioContext = createContext(audioTracks);

export const useAudio = () => useContext(AudioContext);
