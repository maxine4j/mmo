import {
    AuthLoginPacket, AccountPacket,
} from '../../common/Packet';
import AccountEntity from '../models/Account.entity';

// log a user in with plaintext password (TEMP)
export async function handleAuthLogin(sessionid: string, packet: AuthLoginPacket): Promise<AccountPacket> {
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
        account.session = sessionid;
        console.log(`User ${packet.username} logged in successfully on ${account.session}`);
        account.save();
        return <AccountPacket>{
            success: true,
            message: `logged in as ${account.name}`,
            account: account.toNet(),
        };
    }
    console.log(`User ${packet.username} provided incorrect login details`);
    return <AccountPacket>{
        success: false,
        message: 'Incorrect username or password',
    };
}

// log a user account out and make sure all of their characters are logged out too
export async function handleAuthLogout(sessionid: string) {
    const account = await AccountEntity.findOne({ session: sessionid });
    if (account) {
        console.log(`User ${account.temp_username} has logged out`);
        account.session = null;
        account.save();
    }
}
