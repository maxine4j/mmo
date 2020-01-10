import Point from './Point';

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
    NORTH_EAST,
    NORTH_WEST,
    SOUTH,
    SOUTH_EAST,
    SOUTH_WEST,
    EAST,
    WEST
}

export default interface Character {
    id: number;
    name: string;
    level: number;
    race: Race;
    position: Point;
    facing: Facing;
}
