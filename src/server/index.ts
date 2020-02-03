import { createConnection } from 'typeorm';
import NetServer from './NetServer';
import initTestDatabase from './testData';

createConnection().then(async (connection) => {
    await initTestDatabase();
    NetServer.init();
}).catch((error) => console.log(error));
