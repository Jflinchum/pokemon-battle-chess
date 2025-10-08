import { MatchHistory } from "../../shared/types/Game";
import { ReplayData } from "../util/downloadReplay";
import { getMockGameState } from "./gameState";
import { getMockPlayer } from "./player";

export const getMockReplayData = (): ReplayData => {
  return {
    players: [
      getMockPlayer({ isPlayer1: true, color: "w", isHost: true }),
      getMockPlayer({ isPlayer2: true, color: "b" }),
    ],
    whitePlayer: getMockPlayer({ isPlayer1: true, color: "w", isHost: true }),
    blackPlayer: getMockPlayer({ isPlayer2: true, color: "b" }),
    seed: "1234,test-seed",
    options: {
      ...getMockGameState().gameSettings.options,
      timersEnabled: false,
    },
    matchHistory: getMockMatchHistory(),
  };
};

export const getMockMatchHistory = (): MatchHistory => [
  {
    type: "chess",
    data: {
      color: "w",
      san: "d4",
    },
  },
  {
    type: "chess",
    data: {
      color: "b",
      san: "e5",
    },
  },
  {
    type: "pokemon",
    data: {
      event: "battleStart",
      p1Pokemon: {
        name: "Tauros",
        species: "Tauros-Paldea-Combat",
        gender: "M",
        shiny: false,
        level: 82,
        moves: ["earthquake", "closecombat", "ironhead", "stoneedge"],
        ability: "Intimidate",
        evs: {
          hp: 85,
          atk: 85,
          def: 85,
          spa: 85,
          spd: 85,
          spe: 85,
        },
        ivs: {
          hp: 31,
          atk: 31,
          def: 31,
          spa: 31,
          spd: 31,
          spe: 31,
        },
        item: "Choice Band",
        teraType: "Steel",
        nature: "Serious",
      },
      p2Pokemon: {
        name: "Rotom",
        species: "Rotom-Wash",
        gender: "N",
        shiny: false,
        level: 83,
        moves: ["hydropump", "thunderbolt", "painsplit", "trick"],
        ability: "Levitate",
        evs: {
          hp: 85,
          atk: 0,
          def: 85,
          spa: 85,
          spd: 85,
          spe: 85,
        },
        ivs: {
          hp: 31,
          atk: 0,
          def: 31,
          spa: 31,
          spd: 31,
          spe: 31,
        },
        item: "Choice Scarf",
        teraType: "Electric",
        nature: "Serious",
      },
      attemptedMove: {
        san: "dxe5",
        color: "w",
      },
    },
  },
  {
    type: "pokemon",
    data: {
      event: "streamOutput",
      chunk: "|t:|1758403738\n|gametype|singles",
    },
  },
  {
    type: "pokemon",
    data: {
      event: "streamOutput",
      chunk: "|player|p1|fe419989-1526-407a-ac2a-716a226adf26||",
    },
  },
  {
    type: "pokemon",
    data: {
      event: "streamOutput",
      chunk:
        '|request|{"active":[{"moves":[{"move":"Earthquake","id":"earthquake","pp":16,"maxpp":16,"target":"allAdjacent","disabled":false},{"move":"Close Combat","id":"closecombat","pp":8,"maxpp":8,"target":"normal","disabled":false},{"move":"Iron Head","id":"ironhead","pp":24,"maxpp":24,"target":"normal","disabled":false},{"move":"Stone Edge","id":"stoneedge","pp":8,"maxpp":8,"target":"normal","disabled":false}],"canTerastallize":"Steel"}],"side":{"name":"fe419989-1526-407a-ac2a-716a226adf26","id":"p1","pokemon":[{"ident":"p1: Tauros","details":"Tauros-Paldea-Combat, L82, M","condition":"257/257","active":true,"stats":{"atk":228,"def":219,"spa":96,"spd":162,"spe":211},"moves":["earthquake","closecombat","ironhead","stoneedge"],"baseAbility":"intimidate","item":"choiceband","pokeball":"pokeball","ability":"intimidate","commanding":false,"reviving":false,"teraType":"Steel","terastallized":""}]},"noCancel":true}',
    },
  },
  {
    type: "pokemon",
    data: {
      event: "streamOutput",
      chunk:
        "|player|p2|204a8fdb-7d9c-4c1e-af75-76bad967f5e3||\n|teamsize|p1|1\n|teamsize|p2|1\n|gen|9\n|tier|pbc\n|\n|t:|1758403738\n|start\n|switch|p1a: Tauros|Tauros-Paldea-Combat, L82, M|257/257\n|switch|p2a: Rotom|Rotom-Wash, L83|100/100\n|-weather|Sandstorm\n|message|Tauros receives a stat boost from starting the battle!\n|-boost|p1a: Tauros|spe|1\n|-ability|p1a: Tauros|Intimidate|boost\n|-unboost|p2a: Rotom|atk|1\n|turn|1",
    },
  },
  {
    type: "pokemon",
    data: {
      event: "streamOutput",
      chunk:
        '|request|{"active":[{"moves":[{"move":"Earthquake","id":"earthquake","pp":16,"maxpp":16,"target":"allAdjacent","disabled":true},{"move":"Close Combat","id":"closecombat","pp":8,"maxpp":8,"target":"normal","disabled":true},{"move":"Iron Head","id":"ironhead","pp":24,"maxpp":24,"target":"normal","disabled":true},{"move":"Stone Edge","id":"stoneedge","pp":7,"maxpp":8,"target":"normal","disabled":false}],"canTerastallize":"Steel"}],"side":{"name":"fe419989-1526-407a-ac2a-716a226adf26","id":"p1","pokemon":[{"ident":"p1: Tauros","details":"Tauros-Paldea-Combat, L82, M","condition":"130/257","active":true,"stats":{"atk":228,"def":219,"spa":96,"spd":162,"spe":211},"moves":["earthquake","closecombat","ironhead","stoneedge"],"baseAbility":"intimidate","item":"choiceband","pokeball":"pokeball","ability":"intimidate","commanding":false,"reviving":false,"teraType":"Steel","terastallized":""}]},"noCancel":true}',
    },
  },
  {
    type: "pokemon",
    data: {
      event: "streamOutput",
      chunk:
        "|\n|t:|1758403751\n|move|p1a: Tauros|Stone Edge|p2a: Rotom\n|-crit|p2a: Rotom\n|-damage|p2a: Rotom|34/100\n|move|p2a: Rotom|Thunderbolt|p1a: Tauros\n|-damage|p1a: Tauros|146/257\n|\n|-weather|Sandstorm|[upkeep]\n|-damage|p1a: Tauros|130/257|[from] Sandstorm\n|-damage|p2a: Rotom|28/100|[from] Sandstorm\n|upkeep\n|turn|2",
    },
  },
  {
    type: "pokemon",
    data: {
      event: "streamOutput",
      chunk:
        "|\n|t:|1758403761\n|move|p1a: Tauros|Stone Edge|p2a: Rotom|[miss]\n|-miss|p1a: Tauros|p2a: Rotom\n|move|p2a: Rotom|Thunderbolt|p1a: Tauros\n|-damage|p1a: Tauros|15/257\n|\n|-weather|Sandstorm|[upkeep]\n|-damage|p1a: Tauros|0 fnt|[from] Sandstorm\n|-damage|p2a: Rotom|22/100|[from] Sandstorm\n|faint|p1a: Tauros\n|\n|win|204a8fdb-7d9c-4c1e-af75-76bad967f5e3",
    },
  },
  {
    type: "weather",
    data: {
      event: "weatherChange",
      modifier: {
        type: "modify",
        squareModifiers: [
          {
            square: "e5",
            modifiers: {
              weather: {
                id: "sandstorm",
                duration: 3,
              },
            },
          },
        ],
      },
    },
  },
  {
    type: "pokemon",
    data: {
      event: "victory",
      color: "b",
    },
  },
  {
    type: "chess",
    data: {
      color: "w",
      san: "dxe5",
      failed: true,
    },
  },
];
