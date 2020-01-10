import io from 'socket.io';
import {
    AuthLoginPacket, AccountPacket, CharactersPacket, ResponsePacket, CharacterPacket,
} from '../../common/Packet';
import AccountEntity from '../entities/Account.entity';
import CharacterEntity from '../entities/Character.entity';

// log a user in with plaintext password (TEMP)
export async function handleAuthLogin(session: io.Socket, packet: AuthLoginPacket): Promise<AccountPacket> {
    console.log(`User ${packet.username} is attempting to log in`);
    const account = await AccountEntity.createQueryBuilder()
        .where('LOWER(temp_username) = LOWER(:username)', { username: packet.username })
        .andWhere('temp_password = :password', { password: packet.password })
        .getOne();
    if (account) {
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
        ap.message = `logged in as ${account.name}`;
        return ap;
    }
    console.log(`User ${packet.username} provided incorrect login details`);
    return <AccountPacket>{
        success: false,
        message: 'Incorrect username or password',
    };
}

// log a user account out and make sure all of their characters are logged out too
export async function handleAuthLogout(session: io.Socket) {
    const account = await AccountEntity.findOne({ session: session.id });
    if (account) {
        console.log(`User ${account.temp_username} has logged out`);
        account.session = null;
        account.save();
    }
}

export async function handleMyList(session: io.Socket): Promise<CharactersPacket> {
    const charEntities = await CharacterEntity.createQueryBuilder()
        .leftJoinAndSelect('CharacterEntity.account', 'AccountEntity')
        .where('AccountEntity.session = :sessionid', { sessionid: session.id })
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
    await char.save();
    // send success response
    return <ResponsePacket>{
        success: true,
        message: '',
    };
}
