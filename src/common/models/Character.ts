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

export default interface Character {
    id: number;
    name: string;
    level: number;
    race: Race;
    posX: number;
    posY: number;
    destX: number;
    destY: number;
    facing: Facing;
}
