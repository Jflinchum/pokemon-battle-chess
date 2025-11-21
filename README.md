# Pokémon Gambit

A mixture between Pokemon and Chess! Each chess piece gets assigned a Pokemon, which you can then do battle with when you attempt to take a piece!

You can view it live, here: https://pokemon-gambit.com/

## Overview

Pokémon Gambit consists of five core components:

- React Frontend (located in ./src)
- Lobby Server (located in ./lobbyServer)
- Game Server (located in ./gameServer)
- Redis
- HAProxy (reverse proxy)

Any logic that is re-used across the three components is located in the ./shared directory

### React Frontend

This contains all of the client code for rendering the game to the user. We make API requests from here to the Lobby Server and connect to the websockets on the Game Server Socket.io

### Lobby Server

The main responsibilities for the Lobby Server involve:

- Serving the bundled frontend code to the user
- Handling API requests for fetching and creating game rooms
  - Most of these requests simply get logged, validated, and forwared to the Game Server.
- A few clean up cron jobs
- A logging endpoint for the frontend to send logs through

### Game Server

Here, we handle most of the game logic and validation of socket events. It sets up a websocket server for the client to connect and send events through. Whenever the client sends an event to a game room (moving a chess piece for example), the general process is:

- Validate the socket request is legit
- Pull in all game state currently stored in Redis
- Apply the socket event (moving the chess piece, choosing a pokemon move, etc.)
- Store the new game state within Redis
- Communicate back to the client the results

## How to Run

- Before running this project, you'll want to set up some localhost certs for running https locally.
  - Place the certificate under `shared/tls.crt` and the private key under `shared/tls.key`
- Install Docker
- Run docker compose build
- Run docker compose up

## Credits

Chess Assets - Cburnett https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces

Chess Engine - https://github.com/jhlywa/chess.js

Pokémon Engine - https://github.com/pkmn/ps
