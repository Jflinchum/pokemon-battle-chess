import { SideID } from "@pkmn/data";
import { Protocol } from "@pkmn/protocol";

export type WeatherId = 'sandstorm' | 'sunnyday' | 'raindance' | 'snowscape';

export type TerrainId = 'electricterrain' | 'grassyterrain' | 'psychicterrain' | 'mistyterrain';

export type CustomArgTypes = Protocol.ArgType | ['-forfeit', SideID];