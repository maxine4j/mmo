import { createConnection } from 'typeorm';
import NetServer from './NetServer';
import AccountEntity from './entities/Account.entity';
import ItemTypeEntity from './entities/ItemType.entity';

async function initItems(): Promise<void> {
    const item0 = new ItemTypeEntity();
    item0.id = 0;
    item0.icon = 81;
    item0.name = 'Iron Sword';
    await item0.save();

    const item1 = new ItemTypeEntity();
    item1.id = 1;
    item1.icon = 91;
    item1.name = 'Iron Axe';
    await item1.save();

    const item2 = new ItemTypeEntity();
    item2.id = 2;
    item2.icon = 92;
    item2.name = 'Flail';
    await item2.save();

    const item3 = new ItemTypeEntity();
    item3.id = 3;
    item3.icon = 94;
    item3.name = 'Whip';
    await item3.save();

    const item4 = new ItemTypeEntity();
    item4.id = 4;
    item4.icon = 97;
    item4.name = 'Wooden Shield';
    await item4.save();

    const item5 = new ItemTypeEntity();
    item5.id = 5;
    item5.icon = 144;
    item5.name = 'Health Potion';
    await item5.save();
}

async function initDB(): Promise<void> {
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

    await initItems();
}

createConnection().then(async (connection) => {
    await initDB();
    NetServer.init();
}).catch((error) => console.log(error));
