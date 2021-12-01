import dotenv from 'dotenv';
dotenv.config();
import { MessageActionRow, MessageButton } from 'discord.js';
import { getDatabase, setDatabase } from './database.js';
import { getBalance, getPending, validateAddress } from './utils.js';
import { send_tx } from './tGRLC.js';
import garlicore from 'garlicore-lib';
const rounding_error = 0.005;
let lotteries_pending_confirmation = {};
const grlc_or_tgrlc = process.env.T_GRLC; // 'tGRLC' or 'GRLC'


// /lottery enter {lotteryId}
// /lottery status {lotteryId}
// /lottery win_address {address}
// /lottery create {name} {amount_to_enter} {end_time} {win_percentage} Optional: {split_2_name} {split_2_percentage} {split_2_address} Optional2: {split_3_name} {split_3_percentage} {split_3_address}

/*
// Example in database:
let lottery = {
    total_lotteries: 0,
    win_address: { userId: address, userId2: address2 },
    lotteryId: {
        requirements: {
            name: 'Lottery name',
            amount_to_enter: 6.9,
            end_time: 1637754910, // UNIX timestamp
            win_percentage: 50,
            // optional:
            split_2_name: 'AirDrop',
            split_2_percentage: 25,
            split_2_address: 'GarlicAddress2',
            // optional2:
            split_3_name: 'Community',
            split_3_percentage: 25,
            split_3_address: 'GarlicAddress3'
        },
        creator: userId,
        isActive: true,
        entered_users: [userId1, userId2, etc],
        users: {
            userId1: { entered: false },
            userId2: { entered: true },
        }
    }
}
*/


async function enterLottery(interaction, userId, lotteryId) {
    let lotteries = await getDatabase('lottery');
    let current_lottery = lotteries[lotteryId];
    const password = userId.toString() + lotteryId.toString() + process.env.LOTTERY_PASSWORD;
    const address = new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(password)))).toAddress();
    if (!current_lottery) {
        interaction.editReply("There is no lottery with that ID.");
        return;
    }
    if (current_lottery.requirements.end_time < Math.floor(Date.now() / 1000)) {
        interaction.editReply(`The lottery ended <t:${current_lottery.requirements.end_time}:R>`);
        return;
    }
    if (!lotteries.win_address[userId]) {
        interaction.editReply("You don't have a winnings address set. Please use `/lottery win_address` before entering any lottery.");
        return;
    }
    let balance = await getBalance(address, grlc_or_tgrlc);
    const win_address = lotteries.win_address[userId];
    if (balance.error) {
        interaction.editReply("An error is happening right now when accessing your balance using freshgrlc.net's API, try again later.");
        return;
    }
    let pending_balance = await getPending(address, grlc_or_tgrlc);
    if (pending_balance.error) {
        interaction.editReply("An error is happening right now when accessing your pending balance using freshgrlc.net's API, try again later.");
        return;
    } else if (pending_balance.data > 0) {
        interaction.editReply(`You have ${pending_balance.data} ${grlc_or_tgrlc} pending. Wait some time before trying again.`);
        return;
    }
    balance = balance.data;
    if (!current_lottery.users[userId]) { // New lottery user. Will get saved in the database.
        let not_registered = `You are NOT participating in **${lotteryId}. ${current_lottery.requirements.name}**.\nSend **${current_lottery.requirements.amount_to_enter} ${grlc_or_tgrlc}** to ${address} to enter.\n`;
        not_registered += `You can pay in different transactions until the amount is reached. Any extra ${grlc_or_tgrlc} will be returned when the lottery ends or when you use ` + '`/lottery status`.\n';
        not_registered += `Your extra ${grlc_or_tgrlc} and winnings address is ${win_address}. You can change it using ` + '`/lottery win_address`.\n';
        not_registered += `The lottery will end on <t:${current_lottery.requirements.end_time}:F> (<t:${current_lottery.requirements.end_time}:R>).`;
        interaction.editReply(not_registered);
        lotteries[lotteryId].users[userId] = { entered: false };
        setDatabase('lottery', lotteries);
    } else if ((balance + rounding_error) >= current_lottery.requirements.amount_to_enter) { // Enough payed // rounding_error to avoid errors
        let refund_msg = '';
        if ((balance - current_lottery.requirements.amount_to_enter) > rounding_error * 10) {
            const extra_amount = balance - current_lottery.requirements.amount_to_enter;
            refund_msg = `You payed ${extra_amount} extra ${grlc_or_tgrlc}, they are being returned to your winnings address.\nTransaction details: `;
            refund_msg += await refund(win_address, address, current_lottery.requirements.amount_to_enter, userId, lotteryId);
        }
        lotteries[lotteryId].users[userId] = { entered: true };
        if (!lotteries[lotteryId].entered_users.includes(userId)) {
            lotteries[lotteryId].entered_users.push(userId);
        }
        setDatabase('lottery', lotteries);
        interaction.editReply(`You are participating in **${lotteryId}. ${current_lottery.requirements.name}**. You have already payed the required amount (${current_lottery.requirements.amount_to_enter} ${grlc_or_tgrlc}) to ${address}.\n${refund_msg}`);
    } else if ((balance + rounding_error) < current_lottery.requirements.amount_to_enter) { // Not enough payed // rounding_error to avoid errors
        let not_enough = `You are NOT participating in **${lotteryId}. ${current_lottery.requirements.name}** (${current_lottery.requirements.amount_to_enter} ${grlc_or_tgrlc}).\nSend ${current_lottery.requirements.amount_to_enter - balance} ${grlc_or_tgrlc} to ${address} to enter.\n`;
        not_enough += `If the amount is not reached before the lottery ends (<t:${current_lottery.requirements.end_time}:R>), the amount payed will be returned to ${win_address}.`;
        interaction.editReply(not_enough);
    }
}


async function winAddress(interaction, userId, address) {
    let lotteries = await getDatabase('lottery');
    lotteries.win_address[userId] = address;
    let valid = await validateAddress(address);
    if (!valid.isValid) {
        interaction.reply("The address you entered is not a valid garlicoin address.");
        return;
    }
    setDatabase('lottery', lotteries);
    interaction.reply(`Your winnings address has been set to ${address}.`);
}


async function statusLottery(interaction, userId, lotteryId) {
    let lotteries = await getDatabase('lottery');
    let current_lottery = lotteries[lotteryId];
    let total_participants = current_lottery.entered_users.length;
    let status = `There are currently ${total_participants} participants.\nThe entry amount to enter is ${current_lottery.requirements.amount_to_enter} ${grlc_or_tgrlc}.`;
    status += `The lottery ends on <t:${current_lottery.requirements.end_time}:F> (<t:${current_lottery.requirements.end_time}:R>).\nThe split is:\n`;
    const winner = total_participants * current_lottery.requirements.amount_to_enter * (current_lottery.requirements.win_percentage / 100);
    status += `Winner: ${winner} ${grlc_or_tgrlc} (${current_lottery.requirements.win_percentage}%)\n`;
    if (current_lottery.requirements.split_2_name) {
        const split_2 = total_participants * current_lottery.requirements.amount_to_enter * (current_lottery.requirements.split_2_percentage / 100);
        status += `${current_lottery.requirements.split_2_name}: ${split_2} ${grlc_or_tgrlc} (${current_lottery.requirements.split_2_percentage}%)\n`;
    }
    if (current_lottery.requirements.split_3_name) {
        const split_3 = total_participants * current_lottery.requirements.amount_to_enter * (current_lottery.requirements.split_3_percentage / 100);
        status += `${current_lottery.requirements.split_3_name}: ${split_3} ${grlc_or_tgrlc} (${current_lottery.requirements.split_3_percentage}%)\n\n`;
    }
    const password = userId.toString() + lotteryId.toString() + process.env.LOTTERY_PASSWORD;
    const address = new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(password)))).toAddress();
    if (!current_lottery.users[userId]) { // Not in lottery
        status += `You are NOT participating in **${lotteryId}. ${current_lottery.requirements.name}**. ` + "Use `/lottery enter`";
        interaction.reply(status);
    } else {
        let balance = await getBalance(address, grlc_or_tgrlc);
        if (balance.error) {
            status += "An error is happening right now when accessing your balance using freshgrlc.net's API, try again later.";
            interaction.reply(status);
            return;
        }
        let pending_balance = await getPending(address, grlc_or_tgrlc);
        if (pending_balance.error) {
            status += "An error is happening right now when accessing your pending balance using freshgrlc.net's API, try again later.";
            interaction.reply(status);
            return;
        } else if (pending_balance.data > 0) {
            interaction.reply(`You have ${pending_balance.data} ${grlc_or_tgrlc} pending. Wait some time before trying again.`);
            return;
        }
        balance = balance.data;
        const win_address = lotteries.win_address[userId];
        if ((balance + rounding_error) >= current_lottery.requirements.amount_to_enter) { // Enough payed // rounding_error to avoid errors
            let refund_msg = '';
            if (balance > current_lottery.requirements.amount_to_enter) {
                const extra_amount = balance - current_lottery.requirements.amount_to_enter;
                refund_msg = `You payed ${extra_amount} extra ${grlc_or_tgrlc}, they are being returned to your winnings address.\n`;
                refund_msg += await refund(win_address, address, current_lottery.requirements.amount_to_enter, userId, lotteryId);
            }
            let recent_lotteries = await getDatabase('lottery');
            recent_lotteries[lotteryId].users[userId] = { entered: true };
            if (!recent_lotteries[lotteryId].entered_users.includes(userId)) {
                recent_lotteries[lotteryId].entered_users.push(userId);
            }
            setDatabase('lottery', recent_lotteries);
            status += `You are participating in **${lotteryId}. ${current_lottery.requirements.name}**. You have already payed the required amount to ${address}.\n${refund_msg}`;
            interaction.reply(status);
        } else if ((balance + rounding_error) < current_lottery.requirements.amount_to_enter) { // Not enough payed // rounding_error to avoid errors
            let not_enough = `You are NOT participating in **${lotteryId}. ${current_lottery.requirements.name}**.\nSend ${current_lottery.requirements.amount_to_enter - balance} ${grlc_or_tgrlc} to ${address} to enter.\n`;
            not_enough += `If the amount is not reached before the lottery ends (<t:${current_lottery.requirements.end_time}:R>), the amount payed will be returned to ${win_address} .`;
            interaction.reply(not_enough);
        }
    }
}


async function createLottery(interaction, userId, name, amount_to_enter, end_time, win_percentage, split_2_name, split_2_percentage, split_2_address, split_3_name, split_3_percentage, split_3_address) {
    let message = "Confirm you want to create the following:\n";
    if (!split_2_percentage) split_2_percentage = 0;
    if (!split_3_percentage) split_3_percentage = 0;
    if ((win_percentage + split_2_percentage + split_3_percentage) != 100) {
        interaction.reply("The sum of the percentages must be 100.");
        return;
    }
    if (end_time < Math.floor(Date.now() / 1000)) {
        interaction.reply("The end time must be in the future. (In UNIX time)");
        return;
    }
    if (name.length > 80) {
        interaction.reply("The name must be less than 80 characters long.");
        return;
    }
    if (amount_to_enter < 0.01) {
        interaction.reply("The amount to enter must be greater than 0.01");
        return;
    }
    message += `Name: ${name}\n`;
    message += `Amount to enter: ${amount_to_enter} ${grlc_or_tgrlc}\n`;
    message += `End time: <t:${end_time}:F> (<t:${end_time}:R>)\n`;
    message += `Win percentage: ${win_percentage}%\n`;
    if (split_2_name && split_2_percentage && split_2_address) {
        let valid2 = await validateAddress(split_2_address);
        if (valid2.error) {
            interaction.reply("Something went wrong with the RPC connection. (split_2_address) (Bot's fault)");
            return;
        } else if (!valid2.isValid) {
            interaction.reply("The second split address is not valid.");
            return;
        }
        message += `\nSplit 2 name: ${split_2_name}\n`;
        message += `Split 2 percentage: ${split_2_percentage}%\n`;
        message += `Split 2 address: ${split_2_address}\n`;
    }
    if (split_3_name && split_3_percentage && split_3_address) {
        let valid3 = await validateAddress(split_3_address);
        if (valid3.error) {
            interaction.reply("Something went wrong with the RPC connection. (split_3_address) (Bot's fault)");
            return;
        } else if (!valid3.isValid) {
            interaction.reply("The third split address is not valid.");
            return;
        }
        message += `\nSplit 3 name: ${split_3_name}\n`;
        message += `Split 3 percentage: ${split_3_percentage}%\n`;
        message += `Split 3 address: ${split_3_address}\n`;
    }
    let pending_lottery = {
        "requirements": {
            "name": name,
            "amount_to_enter": amount_to_enter,
            "end_time": end_time, // UNIX timestamp
            "win_percentage": win_percentage,
        },
        "creator": userId,
        "entered_users": [],
        "users": {}
    }
    if (split_2_name) {
        pending_lottery.requirements["split_2_name"] = split_2_name;
        pending_lottery.requirements["split_2_percentage"] = split_2_percentage;
        pending_lottery.requirements["split_2_address"] = split_2_address;
    }
    if (split_3_name) {
        pending_lottery.requirements["split_3_name"] = split_3_name;
        pending_lottery.requirements["split_3_percentage"] = split_3_percentage;
        pending_lottery.requirements["split_3_address"] = split_3_address;
    }
    lotteries_pending_confirmation[userId] = pending_lottery;
    const row = new MessageActionRow();
    row.addComponents(new MessageButton()
        .setLabel('Confirm')
        .setCustomId('LTConfirm')
        .setStyle('PRIMARY'));
    interaction.reply({ content: message, components: [row], ephemeral: true });
}


async function confirmLotteryCreation(interaction) {
    if (!lotteries_pending_confirmation[interaction.user.id]) {
        interaction.reply("You have no pending lottery to confirm.");
        return;
    }
    let lotteries = await getDatabase('lottery');
    lotteries.total_lotteries++;
    let lotteryId = lotteries.total_lotteries;
    lotteries[lotteryId] = lotteries_pending_confirmation[interaction.user.id];
    lotteries[lotteryId].isActive = true;
    lotteries_pending_confirmation[interaction.user.id] = undefined;
    setDatabase('lottery', lotteries);
    interaction.reply(`**${lotteryId}.- ${lotteries[lotteryId].requirements.name}** has started!`);
}


async function refund(win_address, deposit_address, entry_amount, userId, lotteryId) {
    const password = userId.toString() + lotteryId.toString() + process.env.LOTTERY_PASSWORD;
    deposit_address = deposit_address.toString();
    // the exact amount will be sent to the user deposit address. 
    // The rest will be sent to the change address (win_address).
    let refund_tx = await send_tx(password, deposit_address, entry_amount, undefined, win_address);
    return refund_tx;
}


async function executeLottery(interaction, lotteryId) { } // isActive: false


async function over600utxo() { } // Take care of over 600 utxo transactions


export { enterLottery, statusLottery, winAddress, createLottery, confirmLotteryCreation };