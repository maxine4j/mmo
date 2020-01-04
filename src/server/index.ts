import { createConnection, Connection } from 'typeorm';
import NetServer from './NetServer';
import Account from './models/Account.entity';

async function initDB() {
    const account = new Account();
    account.id = 1;
    account.name = 'Tim Ings';
    account.temp_username = 'arwic';
    account.temp_password = 'asd';
    account.session = null;
    await account.save();
}

createConnection().then(async (connection) => {
    await initDB();
    NetServer.init();
}).catch((error) => console.log(error));
