import { Counter } from 'prom-client';

const userSignupCounter = new Counter({
  name: 'mmo_user_signup_count',
  help: 'count of signups',
});

const userLoginCounter = new Counter({
  name: 'mmo_user_login_count',
  help: 'count of logins',
});

const userLogOutCounter = new Counter({
  name: 'mmo_user_log_out_count',
  help: 'count of log outs',
});

const characterCreatCounter = new Counter({
  name: 'mmo_character_create_count',
  help: 'count of character creations',
});

const playerEnterWorldCounter = new Counter({
  name: 'mmo_player_enter_world',
  help: 'count of plyers entering world',
});

const playerLeaveWorldCounter = new Counter({
  name: 'mmo_player_leave_world',
  help: 'count of plyers leaving world',
});

const chatMessageCounter = new Counter({
  name: 'mmo_chat_message_count',
  help: 'count of chat messages',
  labelNames: ['type'],
});

const itemDropCounter = new Counter({
  name: 'mmo_item_drop_count',
  help: 'count of item drops',
});

const itemPickupCounter = new Counter({
  name: 'mmo_item_pickup_count',
  help: 'count of item pickups',
});

const itemDespawnedCounter = new Counter({
  name: 'mmo_item_despawn_count',
  help: 'count of item despawns',
});

const playerLevelUpCounter = new Counter({
  name: 'mmo_player_level_up_count',
  help: 'count of player level ups',
  labelNames: ['skill'],
});

const playerExpGainedCounter = new Counter({
  name: 'mmo_player_exp_count',
  help: 'count of player exp',
  labelNames: ['skill'],
});

const unitDiedCounter = new Counter({
  name: 'mmo_units_died_count',
  help: 'count of unit deaths',
  labelNames: ['type'],
});

const damageDealtCounter = new Counter({
  name: 'mmo_damage_dealt_count',
  help: 'count of damage dealt',
  labelNames: ['attackerType', 'defenderType'],
});

const resourceHarvestCounter = new Counter({
  name: 'mmo_resource_harvest_counter',
  help: 'count of resources harvested',
  labelNames: ['skill'],
});

const unitSpawnedCounter = new Counter({
  name: 'mmo_unit_spawned_count',
  help: 'count of units spawned',
});

const lootGeneratedCounter = new Counter({
  name: 'mmo_loot_generated_count',
  help: 'count of loot generated',
});

const chunkLoadCounter = new Counter({
  name: 'mmo_chunk_load_count',
  help: 'count of chunks loaded',
});

const packetsReceivedCounter = new Counter({
  name: 'mmo_packets_received_count',
  help: 'count of packets received',
  labelNames: ['header'],
});

const packetsSentCounter = new Counter({
  name: 'mmo_packets_sent_count',
  help: 'count of packets sent',
  labelNames: ['target', 'header'],
});

type UnitType = 'player' | 'monster'

export interface MetricsEmitter {
  userSignup: () => void;
  userLogin: () => void;
  userLogout: () => void;
  playerEnterWorld: () => void;
  playerLeaveWorld: () => void;
  chatMessage: (type: 'message' | 'command') => void;
  itemDropped: () => void;
  itemPickedUp: () => void;
  itemDespawned: () => void;
  playerLevelup: (skill: string) => void;
  playerExpGained: (skill: string, exp: number) => void;
  unitDied: (type: UnitType) => void;
  damageDealt: (attackerType: UnitType, defenderType: UnitType, damage: number) => void;
  resourceHarvest: (skill: string) => void;
  unitSpawn: () => void;
  lootGenerated: () => void;
  chunkLoad: () => void;
  characterCreate: () => void;
  packetReceived: (header: string) => void;
  packetSent: (target: 'broadcast' | 'single', header: string) => void;
}

export const metricsEmitter = (): MetricsEmitter => ({
  userSignup: () => userSignupCounter.inc(),
  userLogin: () => userLoginCounter.inc(),
  userLogout: () => userLogOutCounter.inc(),
  playerEnterWorld: () => playerEnterWorldCounter.inc(),
  playerLeaveWorld: () => playerLeaveWorldCounter.inc(),
  chatMessage: (type) => chatMessageCounter.labels(type).inc(),
  itemDropped: () => itemDropCounter.inc(),
  itemPickedUp: () => itemPickupCounter.inc(),
  itemDespawned: () => itemDespawnedCounter.inc(),
  playerLevelup: (skill) => playerLevelUpCounter.labels(skill).inc(),
  playerExpGained: (skill, exp) => playerExpGainedCounter.labels(skill).inc(exp),
  unitDied: (type) => unitDiedCounter.labels(type).inc(),
  damageDealt: (attackerType, defenderType, damage) => damageDealtCounter.labels(attackerType, defenderType).inc(damage),
  resourceHarvest: (skill: string) => resourceHarvestCounter.labels(skill).inc(),
  unitSpawn: () => unitSpawnedCounter.inc(),
  lootGenerated: () => lootGeneratedCounter.inc(),
  chunkLoad: () => chunkLoadCounter.inc(),
  characterCreate: () => characterCreatCounter.inc(),
  packetReceived: (header) => packetsReceivedCounter.labels(header).inc(),
  packetSent: (target, header) => packetsSentCounter.labels(target, header).inc(),
});
