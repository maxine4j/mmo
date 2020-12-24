import io from 'socket.io';
import uuid from 'uuid/v4';
import bcrypt from 'bcrypt';
import { expToLevel, Skill } from '../common/definitions/CharacterDef';
import {
    AuthLoginPacket, AccountPacket, CharacterListPacket, ResponsePacket, CharacterPacket,
} from '../common/Packet';
import AccountEntity from './entities/Account.entity';
import CharacterEntity from './entities/Character.entity';
import InventoryEntity from './entities/Inventory.entity';
import { InventoryType } from '../common/definitions/InventoryDef';
import ItemEntity from './entities/Item.entity';
import ItemTypeEntity from './entities/ItemType.entity';
import SkillEntity from './entities/Skill.entity';
import { metricsEmitter } from './metrics/metrics';

const metrics = metricsEmitter();

const hashRounds = 12;
const emailRegex = /(?!.*\.\.)(^[^.][^@\s]*@[^@\s]+\.[^@\s.]+$)/;

export async function handleSignup(session: io.Socket, packet: AuthLoginPacket): Promise<ResponsePacket> {
    console.log(`New signup request from ${session.id} with usename ${packet.username}`);
    const existingAccount = await AccountEntity.createQueryBuilder()
        .where('LOWER(email) = LOWER(:username)', { username: packet.username })
        .getOne();

    // check if an account already exists
    if (existingAccount) {
        return <ResponsePacket>{
            success: false,
            message: 'A user with that name already exists',
        };
    }

    // check if the email is valid
    if (!packet.username.match(emailRegex)) {
        return < ResponsePacket > {
            success: false,
            message: 'Invalid email',
        };
    }

    // check if the password is at least 8 characters in length
    if (packet.password.length < 8) {
        return <ResponsePacket>{
            success: false,
            message: 'Password must be at least 8 characters long',
        };
    }

    try {
        // create the new account
        const hash = await bcrypt.hash(packet.password, hashRounds);
        const newAccount = AccountEntity.create();
        newAccount.email = packet.username;
        newAccount.passwordHash = hash;
        await newAccount.save();
        metrics.userSignup();
        return <ResponsePacket>{
            success: true,
            message: '',
        };
    } catch {
        return <ResponsePacket>{
            success: false,
            message: 'Error creating account',
        };
    }
}

// log a user in with plaintext password (TEMP)
export async function handleLogin(session: io.Socket, packet: AuthLoginPacket): Promise<AccountPacket> {
    console.log(`User ${packet.username} is attempting to log in`);
    const account = await AccountEntity.createQueryBuilder()
        .where('LOWER(email) = LOWER(:username)', { username: packet.username })
        .getOne();

    // check if the account exists and password is correct
    if (account && await bcrypt.compare(packet.password, account.passwordHash)) {
        if (account.session != null) {
            console.log(`User ${packet.username} is already logged in`);
            return <AccountPacket>{
                success: false,
                message: 'This account is already logged in',
            };
        }
        account.session = session.id;
        console.log(`User ${packet.username} logged in successfully on ${account.session}`);
        account.save();

        const ap = <AccountPacket>account.toNet();
        ap.success = true;
        ap.message = `logged in as ${account.email}`;
        metrics.userLogin();
        return ap;
    }

    console.log(`User ${packet.username} provided incorrect login details`);
    return <AccountPacket>{
        success: false,
        message: 'Incorrect username or password',
    };
}

// log a user account out and make sure all of their characters are logged out too
export async function handleLogout(session: io.Socket): Promise<void> {
    const account = await AccountEntity.findOne({ session: session.id });
    if (account) {
        console.log(`User ${account.email} has logged out`);
        metrics.userLogout();
        account.session = null;
        account.save();
    }
}

export async function handleMyList(session: io.Socket): Promise<CharacterListPacket> {
    const charEntities = await CharacterEntity.createQueryBuilder()
        .leftJoinAndSelect('CharacterEntity.account', 'AccountEntity')
        .where('AccountEntity.session = :sessionid', { sessionid: session.id })
        .getMany();

    if (charEntities) {
        const chars = charEntities.map((ce) => ce.toNet());

        return <CharacterListPacket>{
            success: true,
            message: '',
            characters: chars,
        };
    }
    return <CharacterListPacket>{
        success: false,
        message: 'Failed to get character list',
        characters: [],
    };
}

export async function handleCreate(sessionid: string, packet: CharacterPacket): Promise<ResponsePacket> {
    // check if the name length is within 2-12 characters
    if (packet.name.length < 2 || packet.name.length > 12) {
        return <ResponsePacket>{
            success: false,
            message: 'Character name must be between 2 and 12 characters',
        };
    }
    // check if the name is only letters
    if (!/^[a-zA-Z]+$/.test(packet.name)) {
        return <ResponsePacket>{
            success: false,
            message: 'Character name must only contain letters',
        };
    }
    // check if the name is taken
    const exisitng = await CharacterEntity.createQueryBuilder()
        .where('LOWER(name) = LOWER(:name)', { name: packet.name })
        .getOne();
    if (exisitng) {
        return <ResponsePacket>{
            success: false,
            message: 'Character with that name already exists',
        };
    }

    // get the account to create the character on
    const account = await AccountEntity.findOne({
        where: {
            session: sessionid,
        },
    });
    // create a new character entity
    const char = new CharacterEntity();
    char.account = account;
    char.name = packet.name;
    char.race = packet.race;
    char.level = 1;
    char.posX = 0; // TODO: set this to starting zone based on race
    char.posY = 0;
    char.positionMapID = 0;

    char.bags = new InventoryEntity();
    char.bags.type = InventoryType.BAGS;
    char.bags.items = [];
    char.bags.capacity = 28;

    // TODO: temp starting inventory
    for (let i = 0; i < 28; i++) {
        // eslint-disable-next-line no-await-in-loop
        const itemEntity = await ItemTypeEntity.findOne({ id: i });
        if (!itemEntity) break;
        const item = new ItemEntity();
        item.uuid = uuid();
        item.slot = i;
        item.type = itemEntity;
        char.bags.items[i] = item;
        // eslint-disable-next-line no-await-in-loop
    }

    char.bank = new InventoryEntity();
    char.bank.items = [];
    char.bank.type = InventoryType.BAGS;
    char.bank.capacity = 1000;

    char.skills = [];
    for (let i = 0; i < 23; i++) {
        char.skills[i] = SkillEntity.create({
            type: { id: i },
            experience: 0,
            current: 1,
        });
    }
    char.skills[Skill.HITPOINTS].experience = 1154; // level 10

    if (char.name === 'levelup') {
        char.skills[Skill.STRENGTH].experience = 60;
    }
    if (char.name === 'highlvl') {
        for (let i = 0; i < 23; i++) {
            char.skills[i].experience = Math.random() * 5_000_000;
            char.skills[i].current = expToLevel(char.skills[i].experience);
        }
    }
    if (char.name === 'max') {
        for (let i = 0; i < 23; i++) {
            char.skills[i].experience = 14_000_000;
            char.skills[i].current = expToLevel(char.skills[i].experience);
        }
    }

    await char.save();
    // send success response
    metrics.characterCreate();
    return <ResponsePacket>{
        success: true,
        message: '',
    };
}
