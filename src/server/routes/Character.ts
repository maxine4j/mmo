import { Packet, CharactersRespPacket, PacketHeader } from '../../common/Packet';
import CharacterEntity from '../models/Character.entity';
import AccountEntity from '../models/Account.entity';

export default async function handleMyList(sessionid: string): Promise<CharactersRespPacket> {
    // FIXME: convert to typeorm subquery instead of two queries
    const account = await AccountEntity.findOne({
        where: {
            session: sessionid,
        },
    });
    const chars = await CharacterEntity.find({
        where: {
            account,
        },
    });

    if (chars) {
        return <CharactersRespPacket>{
            header: PacketHeader.CHAR_MYLIST,
            success: true,
            message: '',
            characters: chars,
        };
    }
    return <CharactersRespPacket>{
        header: PacketHeader.CHAR_MYLIST,
        success: false,
        message: 'Failed to get character list',
        characters: [],
    };
}
