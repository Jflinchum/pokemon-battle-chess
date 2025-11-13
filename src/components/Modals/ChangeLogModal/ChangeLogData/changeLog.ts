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
    title: "CPU Matches",
    version: "v1.0.5",
    mascot: {
      identifier: "Pawniard",
    },
    body: `
#### Hello and thank you for checking out Pokémon Gambit!
I've finally gotten around to adding a computer to play against. It was a lot of work, however I felt it was necessary to allow people
to check out the game with a lower hurdle. There's still some logic I want to add for the CPU to act smarter, however I felt that this was
good enough to get a general feel for the game.

##### Change log for v1.0.5
- Added a way to face off against a CPU, which can be found at the main menu
- The CPU can be loaded in three different difficulties:
  - Easy
    - Lower-level chess plays and considerations
    - _Mostly_ random Pokémon moves.
  - Medium
    - Mid-level chess plays
    - Pokémon moves are now a little more intelligent, taking type effectiveness/weather/terrain/STAB into account.
  - Hard
    - High-level chess plays
    - Pokémon moves now consider priority, item synergies, recovery and defensive strategies, and setup moves.
- The Chess AI was implemented via Stockfish (the same AI used on chess.com)
- The Pokemon AI logic was written by myself, so I'm sure there's many improvements that can be made in this department
- Draft mode logic is pretty simple at the moment. I also plan on improving this area in the future.
`,
  },
  {
    title: "Theme songs!",
    version: "v1.0.4",
    mascot: {
      identifier: "Loudred",
    },
    body: `
#### Hello and thank you for checking out Pokémon Gambit!
This is a smaller patch that focuses on adding more music variety to the battles. Specifically, I wanted to make the king and queen battles more intense.

##### Change log for v1.0.4 
- Added various songs that specifically plays during battles when a King or Queen piece is involved
- Added legendary themes that play for the following legendaries during King/Queen battles:
  - Zekrom & Reshiram
  - Dialga & Palkia (and their origin forms)
  - Ho-oh
  - Zacian & Zamazenta
  - Groudon, Kyogre, & Rayquaza
  - The Regis
  - Xerneas & Yveltal & Zygarde
  - Solagaleo, Lunala, and Necrozma
`,
  },
  {
    title: "Infrastructure infrastructure",
    version: "v1.0.3",
    mascot: {
      identifier: "Porygon-z",
    },
    body: `
#### Hello and thank you for checking out Pokémon Gambit!
This patch should be the last update for a while that touches the infrastructure of how the servers are hosted (finally). Upcoming updates should hopefully 
start to focus on QOL, improve the ease of code contribution, and actual fun features!

##### Change log for v1.0.3 (This is going to be more technical)
- Migrated to a different reverse proxy for a few, much needed, featured:
  - Now, even if a server restart happens, there will always be a backup reverse proxy to server traffic.
`,
  },
  {
    title: "The servers are fixed this time, I swear!",
    version: "v1.0.2",
    mascot: {
      identifier: "Timburr",
    },
    body: `
#### Hello and thank you for checking out Pokémon Gambit!
This game is currently being actively worked on, so please bear with me if things seem slightly unstable. This update should
improve server stability. Next patch should hopefully be the final one in my attempts to make this ship sail smoothly, which will then
allow me to focus on QOL, improve the ease of code contribution, and other fun stuff!

##### Change log for v1.0.2 (This is going to be more technical)
- Changed from having a single Redis server for data storage to Redis Sentinel with multiple Redis servers
  - This means that any server restarts will now preserve game data on backup servers, so current games will no longer clear out randomly on you all.
- Updated the chess UI to be more optimistic about server requests
  - The swap to Redis Sentinel added a bunch of latency, since the write speed was slower. Now the UI updates immediately when you make a chess move and then confirms
  it with the server later.
    `,
  },
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
