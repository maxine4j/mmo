export interface ActionNodeDef {
    harvestRate: number;
    harvestChance: number;
    collapseChance: number;
    respawnTime: number;
    lootTableID: number;
}

export interface ActionNodesDict {
    [key: string]: ActionNodeDef;
}

export interface SkillActionDef {
    skill: string;
    nodes: ActionNodesDict;
}

export default interface ActionsJsonDef {
    [key: string]: SkillActionDef;
}
