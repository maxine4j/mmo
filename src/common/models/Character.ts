export enum Race {
    HUMAN,
    DWARF,
    GNOME,
    NIGHTELF,
    ORC,
    UNDEAD,
}

export enum Facing {
    NORTH,
    SOUTH,
    EAST,
    WEST
}

export default class Character {
    public id: number;
    public name: string;
    public level: number;
    public race: Race;
    public posX: number;
    public posY: number;
    public destX: number;
    public destY: number;
    public facing: Facing;
}
