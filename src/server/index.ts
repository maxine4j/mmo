import { createConnection } from 'typeorm';
import NetServer from './NetServer';
import initTestDatabase from './testData';
import AccountEntity from './entities/Account.entity';
import { initPushgateway } from './metrics/process';

async function clearLogins(): Promise<void> {
    await AccountEntity.createQueryBuilder()
        .update(AccountEntity)
        .set({ session: null })
        .execute();
}

createConnection().then(async () => {
    initPushgateway(process.env.PUSHGATEWAY_URL);
    await initTestDatabase();
    await clearLogins();
    NetServer.init();
}).catch((error) => console.log(error));
