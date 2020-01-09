import {
    CharactersPacket, ResponsePacket, CharacterPacket,
} from '../../common/Packet';
import CharacterEntity from '../models/Character.entity';
import AccountEntity from '../models/Account.entity';

export async function handleMyList(sessionid: string): Promise<CharactersPacket> {
    const charEntities = await CharacterEntity.createQueryBuilder()
        .leftJoinAndSelect('CharacterEntity.account', 'AccountEntity')
        .where('AccountEntity.session = :sessionid', { sessionid })
        .getMany();

    if (charEntities) {
        const chars = charEntities.map((ce) => ce.toNet());

        return <CharactersPacket>{
            success: true,
            message: '',
            characters: chars,
        };
    }
    return <CharactersPacket>{
        success: false,
        message: 'Failed to get character list',
        characters: [],
    };
}

export async function handleCreate(sessionid: string, packet: CharacterPacket): Promise<ResponsePacket> {
    // check if the name length is within 2-12 characters
    if (packet.character.name.length < 2 || packet.character.name.length > 12) {
        return <ResponsePacket>{
            success: false,
            message: 'Character name must be between 2 and 12 characters',
        };
    }
    // check if the name is only letters
    if (!/^[a-zA-Z]+$/.test(packet.character.name)) {
        return <ResponsePacket>{
            success: false,
            message: 'Character name must only contain letters',
        };
    }
    // check if the name is taken
    const exisitng = await CharacterEntity.createQueryBuilder()
        .where('LOWER(name) = LOWER(:name)', { name: packet.character.name })
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
    char.name = packet.character.name;
    char.race = packet.character.race;
    char.level = 1;
    char.posX = 0; // TODO: set this to starting zone based on race
    char.posY = 0;
    char.positionMapID = 0;
    await char.save();
    // send success response
    return <ResponsePacket>{
        success: true,
        message: '',
    };
}
