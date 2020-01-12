import { createConnection } from 'typeorm';
import NetServer from './NetServer';
import AccountEntity from './entities/Account.entity';

async function initDB() {
    const account1 = new AccountEntity();
    account1.id = 1;
    account1.name = 'Tim Ings';
    account1.temp_username = 'arwic';
    account1.temp_password = 'asd';
    account1.session = null;

    const account2 = new AccountEntity();
    account2.id = 2;
    account2.name = 'James';
    account2.temp_username = 'other';
    account2.temp_password = 'asd';
    account2.session = null;

    await account1.save();
    await account2.save();
}

createConnection().then(async (connection) => {
    await initDB();
    NetServer.init();
}).catch((error) => console.log(error));
