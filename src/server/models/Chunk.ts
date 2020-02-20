import InteractableDef from '../../common/definitions/InteractableDef';
import ChunkDef from '../../common/definitions/ChunkDef';
import { Point, PointDef } from '../../common/Point';
import Rectangle from '../../common/Rectangle';
import Unit from './Unit';
import Player from './Player';
import IModel from './IModel';
import GroundItem from './GroundItem';
import { Skill } from '../../common/definitions/CharacterDef';
import Interactable from './Interactable';
import WorldManager from '../managers/WorldManager';

export const WALKABLE = 0;
export const NOT_WALKABLE = 1;

export default class Chunk implements IModel {
    private def: ChunkDef;
    public world: WorldManager;
    public navmap: number[][];
    public allUnits: Map<string, Unit> = new Map();
    public units: Map<string, Unit> = new Map();
    public players: Map<string, Player> = new Map();
    public groundItems: Map<string, GroundItem> = new Map();
    public interactables: Map<String, Interactable> = new Map();
    public size: number;
    public get worldOffset(): Point { return new Point((this.def.x * this.size) - this.size / 2, (this.def.y * this.size) - this.size / 2); }
    public get id(): string { return this.def.id; }
    public get x(): number { return this.def.x; }
    public get y(): number { return this.def.y; }

    public constructor(def: ChunkDef, size: number, world: WorldManager) {
        this.def = def;
        this.size = size;
        this.world = world;
        this.generateNavmap();

        // TEMP: skill node from doodad def
        for (const dd of this.def.doodads) {
            if (dd.uuid.startsWith('test-')) {
                if (dd.uuid.includes('fishing')) {
                    dd.interact = <InteractableDef> {
                        uuid: dd.uuid,
                        nodeType: 'prawns',
                        skill: Skill.FISHING,
                    };
                    const interactable = new Interactable(dd, this);
                    this.interactables.set(dd.interact.uuid, interactable);
                }

                if (dd.uuid.includes('wc')) {
                    dd.interact = <InteractableDef> {
                        uuid: dd.uuid,
                        nodeType: 'tree',
                        skill: Skill.WOODCUTTING,
                    };
                    const interactable = new Interactable(dd, this);
                    this.interactables.set(dd.interact.uuid, interactable);
                }

                if (dd.uuid.includes('cooking')) {
                    dd.interact = <InteractableDef> {
                        uuid: dd.uuid,
                        nodeType: 'fire',
                        skill: Skill.COOKING,
                    };
                    const interactable = new Interactable(dd, this);
                    this.interactables.set(dd.interact.uuid, interactable);
                }
            }
        }
    }

    public addGroundItem(item: GroundItem): void {
        this.groundItems.set(item.uuid, item);
    }

    public removeGroundItem(id: string): void {
        this.groundItems.delete(id);
    }

    private generateNavmap(): void {
        // init all to walkable
        this.navmap = [];
        for (let i = 0; i < this.size; i++) {
            this.navmap[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.navmap[i][j] = WALKABLE;
            }
        }
        // make doodads not walkable
        for (const doodad of this.def.doodads) {
            if (!doodad.walkable) {
                // set the doodads hitboxes as not walkable
                for (const nb of doodad.navblocks) {
                    const i = doodad.y + nb.y;
                    const j = doodad.x + nb.x;
                    if (i >= this.size || i < 0) continue; // TODO: this ignores navblocks off the side of the chunk
                    if (j >= this.size || j < 0) continue;
                    this.navmap[i][j] = NOT_WALKABLE;
                }
            }
        }
    }

    public containsPoint(point: PointDef): boolean {
        const offset = this.worldOffset;
        const bounds = new Rectangle(offset.x, offset.y, this.size, this.size);
        return bounds.contains(Point.fromDef(point));
    }

    public toNet(): ChunkDef {
        return this.def;
    }
}
