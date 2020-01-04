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

    const charArwic = new CharacterEntity();
    charArwic.account = account;
    charArwic.id = 1;
    charArwic.level = 120;
    charArwic.name = 'Arwic';
    charArwic.race = Race.HUMAN;
    await charArwic.save();

    const charArwicdruid = new CharacterEntity();
    charArwicdruid.account = account;
    charArwicdruid.id = 2;
    charArwicdruid.level = 110;
    charArwicdruid.name = 'Arwicdruid';
    charArwicdruid.race = Race.NIGHTELF;
    await charArwicdruid.save();

    const charArwicmage = new CharacterEntity();
    charArwicmage.account = account;
    charArwicmage.id = 3;
    charArwicmage.level = 102;
    charArwicmage.name = 'Arwicmage';
    charArwicmage.race = Race.GNOME;
    await charArwicmage.save();
}

createConnection().then(async (connection) => {
    await initDB();
    NetServer.init();
}).catch((error) => console.log(error));
