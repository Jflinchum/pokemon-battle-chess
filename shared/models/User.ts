export default class User {
  public playerName: string;
  public playerId: string;
  public avatarId: string;
  public connectedRoom: string | null;
  public transient: boolean;
  public playerSecret: string;
  public viewingResults: boolean;
  public spectating: boolean;

  constructor(
    name: string,
    id: string,
    avatarId: string,
    secret: string,
    transient?: boolean,
    viewingResults?: boolean,
    spectating?: boolean,
    roomCode?: string,
  ) {
    this.playerName = name;
    this.playerId = id;
    this.avatarId = avatarId;
    this.viewingResults = viewingResults || false;
    this.transient = transient || false;
    this.playerSecret = secret;
    this.connectedRoom = roomCode || null;
    this.spectating = spectating || false;
  }

  public setRoom(id: string) {
    this.connectedRoom = id;
  }
}
