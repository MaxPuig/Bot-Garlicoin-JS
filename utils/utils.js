import axios from 'axios';
import { getDatabase, setDatabase } from './database.js';
import garlicore from 'bitcore-lib-grlc';
import dotenv from 'dotenv';
dotenv.config();


async function getCMC(currency = "USD") {
    currency = currency.toUpperCase();
    let url_cmc;
    let currencyAPI = currency;
    if (currency == "SATS") { // This has to be done because the API defaults SATS to Baby Satoshi
        url_cmc = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=GRLC&convert_id=9022'
        currencyAPI = '9022';
    } else {
        url_cmc = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=GRLC&convert=' + currency;
    }
    let garlicoinINFO;
    let error = "no";
    let cmcJSON = await getDatabase('cmc');
    let currentTime = Math.floor(Date.now() / 1000);
    const requestOptions = {
        method: 'GET',
        url: url_cmc,
        headers: { 'X-CMC_PRO_API_KEY': process.env.TOKENCMC },
        json: true, gzip: true
    };
    let currentCurrency = currency;
    if (cmcJSON.times == undefined) cmcJSON.times = {};
    if (cmcJSON.values == undefined) cmcJSON.values = {};
    if (currentTime - cmcJSON.times[currentCurrency] >= 200 || cmcJSON.times[currentCurrency] == undefined) { // 3-4 mins
        await axios(requestOptions).then(response => {
            garlicoinINFO = response.data.data.GRLC.quote[currencyAPI];
            garlicoinINFO["lastUpdate"] = "Right Now"
            garlicoinINFO["currency"] = currentCurrency
            cmcJSON.values[currentCurrency] = garlicoinINFO
            cmcJSON.times[currentCurrency] = currentTime;
            setDatabase('cmc', cmcJSON);
        }).catch((err) => {
            console.log('API call error:', err.message);
            error = "yes";
        });
        if (error == "yes") {
            return "error ocurred";
        } else {
            return cmcJSON.values[currentCurrency];
        }
    } else {
        const savedCMC = cmcJSON.values[currentCurrency];
        savedCMC.lastUpdate = (currentTime - cmcJSON.times[currentCurrency]).toString() + " seconds ago"
        return savedCMC;
    }
}


async function saveUser(discordUserID, message, prefix) {
    message = message.split(' ');
    if (message.length != 2) {
        return "Wrong address format. Use `" + prefix + "register <wallet_address>`. Address should start with G, M, W or grlc";
    }
    let wallet = message[1];
    if (wallet.toLowerCase() == "forget") {
        let userWallets = await getDatabase('userWallets');
        delete userWallets[discordUserID];
        await setDatabase('userWallets', userWallets);
        return "Wallet deleted";
    } else if (garlicore.Address.isValid(wallet)) {
        let userWallets = await getDatabase('userWallets');
        userWallets[discordUserID] = wallet;
        await setDatabase('userWallets', userWallets);
        return "Your wallet has been registered: \n`" + wallet + "`";
    } else {
        return "Wrong address format. \n Use `" + prefix + "register <wallet_address>`. \n Address should start with G, M, W or grlc.";
    }
}


async function getBalanceGRLC(address) {
    let error;
    let bal = await axios.get("https://api.freshgrlc.net/blockchain/grlc/address/" + address + "/balance").catch((err) => {
        console.log('API call error:', err.message);
        error = true;
    });
    if (error) {
        return { error: true, data: "An error has occured. Might be `api.freshgrlc.net`'s fault. (You selected GRLC address, not tGRLC)" };
    }
    return { data: bal.data };
}


async function getBalancetGRLC(address) {
    let error;
    let bal = await axios.get("https://api.freshgrlc.net/blockchain/tgrlc/address/" + address + "/balance").catch((err) => {
        error = true;
    });
    if (error) {
        return { error: true, data: "An error has occured. Might be `api.freshgrlc.net`'s fault. (You selected tGRLC address, not GRLC)" };
    }
    return { data: bal.data };
}


async function sendBalance(discordUserID, message, prefix) {
    let userWallets = await getDatabase('userWallets');
    let address = userWallets[discordUserID];
    let cmc;
    if (address != undefined) {
        let balance = await getBalanceGRLC(address);
        if (balance.error) {
            return "Error with freshgarlicblocks.net/api. Try re-registering your address.  Use `" + prefix + "register <wallet_address>`";
        }
        if (message.split(" ").length > 1) {
            cmc = await getCMC(message.split(" ")[1]);
        } else {
            cmc = await getCMC();
        }
        if (cmc == "error ocurred") {
            return "error";
        } else {
            return { "address": address, "balance": balance.data, "value": (balance.data * cmc.price), "currency": cmc.currency, "price": cmc.price, "lastUpdate": cmc.lastUpdate };
        }
    } else {
        return "no_registration";
    }
}


async function sendInfo(discordUserID, prefix) {
    let freshInfo = await axios.get("https://freshgarlicblocks.net/api/poolstats/noheights");
    let poolAvgHash = freshInfo.data.averageHashrate / 1e9;
    let workers = freshInfo.data.workers;
    let lastBlock = await axios.get("https://api.freshgrlc.net/blockchain/grlc/blocks/?limit=1");
    let diff = lastBlock.data[0].difficulty;
    let totalHash = diff * 2 ** 32 / 40 / 1e9;
    let reward = lastBlock.data[0].miningreward;
    let info;
    let userWallets = await getDatabase('userWallets');
    let address = userWallets[discordUserID];
    let error = "no";
    if (address != undefined) { // registered user
        let userInfo = await axios.get("https://freshgarlicblocks.net/api/workerinfo/" + address).catch((err) => {
            console.log('API call error:', err.message);
            error = "yes";
        });
        if (error == "yes") {
            info = { "type": "error", "error": "Error with freshgarlicblocks.net/api. Try re-registering your address.  Use `" + prefix + "register <wallet_address>`", "poolAvgHash": poolAvgHash, "totalHash": totalHash, "workers": workers, "diff": diff, "reward": reward };
            return info; // Wouldn't work inside the .catch
        }
        let payout_address = userInfo.data.nextpayout.address;
        let payout = userInfo.data.nextpayout.grlc;
        let currHashUser = userInfo.data.curhashrate / 1e6;
        let payout_type;
        if (userInfo.data.nextpayout.address == address) { // Instant payout
            payout_type = "Instant";
            info = { "type": "instant", "poolAvgHash": poolAvgHash, "totalHash": totalHash, "workers": workers, "diff": diff, "reward": reward, "payout_address": payout_address, "payout_type": payout_type, "payout": payout, "currHashUser": currHashUser };
            return info;
        } else { // Daily Payout
            payout_type = "Daily";
            let dailyAddress = await axios.get("https://api.freshgrlc.net/blockchain/grlc/search/" + userInfo.data.nextpayout.address);
            let awaitingPayout = dailyAddress.data.balance;
            info = { "type": "daily", "poolAvgHash": poolAvgHash, "totalHash": totalHash, "workers": workers, "diff": diff, "reward": reward, "payout_address": address, "payout_type": payout_type, "payout": payout, "currHashUser": currHashUser, "awaitingPayout": awaitingPayout };
            return info;
        }
    } else {
        info = { "type": "no_wallet", "error": "Want your stats?\nRegister your address using: " + prefix + "register <wallet_address>", "poolAvgHash": poolAvgHash, "totalHash": totalHash, "workers": workers, "diff": diff, "reward": reward };
        return info;
    }
}


export { saveUser, sendInfo, getCMC, sendBalance, getBalancetGRLC, getBalanceGRLC };