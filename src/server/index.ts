import { createConnection, Connection } from 'typeorm';
import NetServer from './NetServer';
import AccountEntity from './models/Account.entity';
import CharacterEntity from './models/Character.entity';
import { Race } from '../common/models/Character';

async function initDB() {
    const account = new AccountEntity();
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
