import { Point } from '../../common/Point';
import { DoodadDef } from '../../common/ChunkDef';
import Chunk from './Chunk';
import Player from './Player';
import _actions from '../data/actions.json';
import ActionJsonDef, { ActionNodeDef } from '../data/ActionsJsonDef';
import LootTable from './LootTable';
import LootTableEntity from '../entities/LootTable.entity';
import GroundItem from './GroundItem';

const actions = <ActionJsonDef>_actions;

export default class Interactable {
    private chunk: Chunk;
    public data: DoodadDef;
    public position: Point;
    private lootTable: LootTable;
    private action: ActionNodeDef;

    public constructor(def: DoodadDef, chunk: Chunk) {
        this.data = def;
        this.chunk = chunk;
        this.action = actions[this.data.interact.skill].nodes[this.data.interact.uuid];

        const offset = this.chunk.worldOffset;
        this.position = new Point(offset.x + this.data.x, offset.y + this.data.y);

        LootTableEntity.findOne({ where: { id: this.action.lootTableID } })
            .then((table) => {
                if (table) {
                    console.log('Got a loot table for action', this.data.interact.uuid);
                    this.lootTable = new LootTable(table);
                } else {
                    console.log(`Warning: No loot table found for action ${this.data.interact.uuid}`);
                }
            })
            .catch((err) => console.log(`Warning: No loot table found for action ${this.data.interact.uuid}`));
    }

    public tickAction(player: Player): void {
        // check if we can harvest this tick
        if (this.chunk.world.currentTick > player.lastHarvestTick + this.action.harvestRate) {
            console.log('Got an action to tick');
            // roll to see if we will harvest
            // TODO: make this chance go up with skill
            if (Math.random() < this.action.harvestChance) {
                console.log('the player successfully harvested!');

                for (const item of this.lootTable.roll()) {
                    console.log('\trecv an item', item.type.name);
                    if (!player.bags.tryAddItem(item)) {
                        console.log('\tplayer inventory full! dropping item to ground');
                        this.chunk.addGroundItem(new GroundItem(item, player.position, this.chunk.world));
                    }
                }
                player.sendBagData();

                player.lastHarvestTick = this.chunk.world.currentTick; // update last harvest tick
                // check if we should collapse the node
                if (Math.random() < this.action.collapseChance) {
                    console.log('Node collapsed!');
                }
            }
        }
    }
}
