import { createConnection, Connection } from 'typeorm';
import NetServer from './NetServer';
import AccountEntity from './entities/Account.entity';
import CharacterEntity from './entities/Character.entity';
import { Race } from '../common/Character';

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
