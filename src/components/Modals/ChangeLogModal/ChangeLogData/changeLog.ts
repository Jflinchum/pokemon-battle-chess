import { GenderName } from "@pkmn/data";

interface ChangeLog {
  title: string;
  version: string;
  mascot: {
    identifier: string;
    gender?: GenderName;
  };
  body: string;
}

export const changeLog: ChangeLog[] = [
  {
    title: "Premoves and Stability",
    version: "v1.0.1",
    mascot: {
      identifier: "Oddish",
    },
    body: `
#### Hello and thank you for checking out Pokémon Gambit!
This game is currently being actively worked on, so please bear with me if things seem slightly unstable. This current version should
hopefully allow people to save their games from ending prematurely if any errors occur.

##### Change log for v1.0.1
- Added a Change Log button on the main menu to display the latest patch notes.
- Adjusted the disconnect timer to kick users out of the room after 5 minutes of disconnection (previously 1 minute).
  - This should allow you all to attempt to re-join the same room and save your ongoing game if any errors occur that kick you out.
- Added an option to enable Chess premoves in the game settings.
  - Previously, this was always enabled with no option to disable it.
    `,
  },
  {
    title: "Hello World!",
    version: "v1.0.0",
    mascot: {
      identifier: "Pikachu",
      gender: "F",
    },
    body: `
#### Hello and thank you for checking out Pokémon Gambit!
This is the first version of Pokémon Gambit! The first release includes:
- Fully functional game with two modes, Draft and Random.
- Weather wars mode to induce weather throughout the Chess board
- Matchmaking
- Player Customization
- Match replays
- ...and many more things that I'm likely forgetting!
    `,
  },
];
