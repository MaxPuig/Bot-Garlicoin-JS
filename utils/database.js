import { Low, JSONFile } from 'lowdb';
const db = new Low(new JSONFile('./data/database.json'));


await db.read();
if (db.data === null) { // If the database doesn't exist, create it.
    db.data = {
        'cmc': {},
        'customPrefix': {},
        'userWallets': {},
        'send_addresses': {},
        'lottery': { total_lotteries: 0, win_address: {} }
    }
    await db.write();
}


/** Returns the object or array. */
async function getDatabase(part) {
    await db.read();
    return db.data[part];
}


/** Save the object or array. */
async function setDatabase(part, value) {
    db.data[part] = value;
    await db.write();
}


export { getDatabase, setDatabase };