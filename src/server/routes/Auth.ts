import {
    Packet, AuthLoginPacket, ResponsePacket, AuthLoginRespPacket,
} from '../../common/Packet';
import NetServer from '../NetServer';
import AccountEntity from '../models/Account.entity';

export async function handleAuthLogin(sessionid: string, packet: AuthLoginPacket): Promise<AuthLoginRespPacket> {
    console.log(`User ${packet.username} is attempting to log in`);
    const account = await AccountEntity.findOne({ temp_username: packet.username, temp_password: packet.password });
    if (account) {
        if (account.session != null) {
            console.log(`User ${packet.username} is already logged in`);
            return <AuthLoginRespPacket>{ success: false, message: 'This account is already logged in' };
        }
        account.session = sessionid;
        console.log(`User ${packet.username} logged in successfully on ${account.session}`);
        account.save();
        return <AuthLoginRespPacket>{
            success: true,
            message: `logged in as ${account.name}`,
            account: account.build(),
        };
    }
    console.log(`User ${packet.username} provided incorrect login details`);
    return <AuthLoginRespPacket>{ success: false, message: 'Incorrect username or password' };
}

export async function handleAuthLogout(sessionid: string) {
    const account = await AccountEntity.findOne({ session: sessionid });
    if (account) {
        console.log(`User ${account.temp_username} has logged out`);
        account.session = null;
        account.save();
    }
}
