import ItemTypeEntity from './entities/ItemType.entity';
import LootTableEntity from './entities/LootTable.entity';
import LootTableItemEntity from './entities/LootTableItem.entity';
import LootTableEntryEntity from './entities/LootTableEntry.entity';
import SkillTypeEntity from './entities/SkillType.entity';
import { Skill } from '../common/definitions/CharacterDef';

async function initSkills(): Promise<void> {
    await Promise.all([
        SkillTypeEntity.create({
            id: Skill.ATTACK,
            name: 'Attack',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.HITPOINTS,
            name: 'Hitpoints',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.MINING,
            name: 'Mining',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.STRENGTH,
            name: 'Strength',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.AGILITY,
            name: 'Agility',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.SMITHING,
            name: 'Smithing',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.DEFENSE,
            name: 'Defense',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.HERBLORE,
            name: 'Herblore',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.FISHING,
            name: 'Fishing',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.RANGED,
            name: 'Ranged',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.THIEVING,
            name: 'Thieving',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.COOKING,
            name: 'Cooking',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.PRAYER,
            name: 'Prayer',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.CRAFTING,
            name: 'Crafting',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.FIREMAKING,
            name: 'Firemaking',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.MAGIC,
            name: 'Magic',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.FLETCHING,
            name: 'Fletching',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.WOODCUTTING,
            name: 'Woodcutting',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.RUNECRAFTING,
            name: 'Runecrafting',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.SLAYER,
            name: 'Slayer',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.FARMING,
            name: 'Farming',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.CONSTRUCTION,
            name: 'Construction',
        }).save(),
        SkillTypeEntity.create({
            id: Skill.HUNTER,
            name: 'Hunter',
        }).save(),
    ]);
}

async function initItems(): Promise<void> {
    let itemID = 0;
    let tableID = 0;
    let tableEntryID = 0;
    let tableEntryItemID = 0;

    const logItem = (item: ItemTypeEntity): void => console.log(`Created ItemTypeEntity: '${item.id}' '${item.name}'`);

    const itemIronSword = new ItemTypeEntity();
    itemIronSword.id = itemID++;
    itemIronSword.icon = 'iron-sword';
    itemIronSword.name = 'Iron Sword';
    await itemIronSword.save();
    logItem(itemIronSword);

    const itemIronAxe = new ItemTypeEntity();
    itemIronAxe.id = itemID++;
    itemIronAxe.icon = 'iron-axe';
    itemIronAxe.name = 'Iron Axe';
    await itemIronAxe.save();
    logItem(itemIronAxe);

    const itemFlail = new ItemTypeEntity();
    itemFlail.id = itemID++;
    itemFlail.icon = 'flail';
    itemFlail.name = 'Flail';
    await itemFlail.save();
    logItem(itemFlail);

    const itemWhip = new ItemTypeEntity();
    itemWhip.id = itemID++;
    itemWhip.icon = 'whip';
    itemWhip.name = 'Whip';
    await itemWhip.save();
    logItem(itemWhip);

    const itemWoodenShield = new ItemTypeEntity();
    itemWoodenShield.id = itemID++;
    itemWoodenShield.icon = 'wooden-shield';
    itemWoodenShield.name = 'Wooden Shield';
    await itemWoodenShield.save();
    logItem(itemWoodenShield);

    const itemHealthPot = new ItemTypeEntity();
    itemHealthPot.id = itemID++;
    itemHealthPot.icon = 'health-potion';
    itemHealthPot.name = 'Health Potion';
    await itemHealthPot.save();
    logItem(itemHealthPot);

    const itemLogs = new ItemTypeEntity();
    itemLogs.id = itemID++;
    itemLogs.icon = 'logs';
    itemLogs.name = 'Logs';
    await itemLogs.save();
    logItem(itemLogs);

    const itemApple = new ItemTypeEntity();
    itemApple.id = itemID++;
    itemApple.icon = 'apple';
    itemApple.name = 'Apple';
    await itemApple.save();
    logItem(itemApple);

    const logTable = (table: LootTableEntity): void => {
        console.log(`Created LootTableEntity: '${table.id}' with ${table.entries.length} entries:`);
        for (const entry of table.entries) {
            console.log(`\tCreated LootTableEntryEntity: '${entry.id}' with ${entry.items.length} items`);
            for (const item of entry.items) {
                console.log(`\t\tCreated LootTableItemEntity: '${item.id}' pointing to '${item.itemType.name}'`);
            }
        }
    };

    // table entries
    const table0Skele = LootTableEntity.create({
        id: tableID++,
        entries: [
            LootTableEntryEntity.create({
                id: tableEntryID++,
                chance: 1,
                minCount: 1,
                maxCount: 3,
                items: [
                    LootTableItemEntity.create({
                        id: tableEntryItemID++,
                        itemType: itemIronSword,
                        weight: 40,
                    }),
                    LootTableItemEntity.create({
                        id: tableEntryItemID++,
                        itemType: itemIronAxe,
                        weight: 10,
                    }),
                    LootTableItemEntity.create({
                        id: tableEntryItemID++,
                        itemType: itemFlail,
                        weight: 5,
                    }),
                    LootTableItemEntity.create({
                        id: tableEntryItemID++,
                        itemType: itemWhip,
                        weight: 5,
                    }),
                ],
            }),
            LootTableEntryEntity.create({
                id: tableEntryID++,
                chance: 0.3,
                minCount: 1,
                maxCount: 1,
                items: [
                    LootTableItemEntity.create({
                        id: tableEntryItemID++,
                        itemType: itemWoodenShield,
                        weight: 20,
                    }),
                    LootTableItemEntity.create({
                        id: tableEntryItemID++,
                        itemType: itemHealthPot,
                        weight: 50,
                    }),
                ],
            }),
        ],
    });
    await table0Skele.save();
    logTable(table0Skele);

    // wooductting table
    const table1Woodcutting = LootTableEntity.create({
        id: tableID++,
        entries: [
            LootTableEntryEntity.create({
                id: tableEntryID++,
                chance: 1,
                minCount: 1,
                maxCount: 1,
                items: [
                    LootTableItemEntity.create({
                        id: tableEntryItemID++,
                        itemType: itemLogs,
                        weight: 100,
                    }),
                ],
            }),
            LootTableEntryEntity.create({
                id: tableEntryID++,
                chance: 0.1,
                minCount: 1,
                maxCount: 1,
                items: [
                    LootTableItemEntity.create({
                        id: tableEntryItemID++,
                        itemType: itemApple,
                        weight: 100,
                    }),
                ],
            }),
        ],
    });
    await table1Woodcutting.save();
    logTable(table1Woodcutting);
}

export default async function initTestDatabase(): Promise<void> {
    await initSkills();
    await initItems();
}
