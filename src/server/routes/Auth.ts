import { Packet, AuthLoginPacket, ResponsePacket } from '../../common/Packet';
import NetServer from '../NetServer';
import Account from '../models/Account.entity';

export default async function handleAuthLogin(packet: AuthLoginPacket): Promise<ResponsePacket> {
    const account = await Account.findOne({ temp_username: packet.username, temp_password: packet.password });
    if (account) {
        return <ResponsePacket>{ success: true, message: `logged in as ${account.name}` };
    }
    return <ResponsePacket>{ success: false, message: 'Unable to find account that username and password' };
}
