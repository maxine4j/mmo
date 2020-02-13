import { createConnection } from 'typeorm';
import NetServer from './NetServer';
import initTestDatabase from './testData';
import AccountEntity from './entities/Account.entity';

async function clearLogins(): Promise<void> {
    await AccountEntity.createQueryBuilder()
        .update(AccountEntity)
        .set({ session: null })
        .execute();
}

createConnection().then(async (connection) => {
    await initTestDatabase();
    await clearLogins();
    NetServer.init();
}).catch((error) => console.log(error));
