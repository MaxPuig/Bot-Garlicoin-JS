import { send_tx } from './tGRLC.js';
import { help_wallet } from './help.js';
import { getBalance, validateAddress } from './utils.js';
import { enterLottery, statusLottery, winAddress, createLottery, confirmLotteryCreation } from './lottery.js';
import garlicore from 'garlicore-lib';
import dotenv from 'dotenv';
dotenv.config();
const grlc_or_tgrlc = process.env.T_GRLC;

async function slash_commands(interaction) {
    if (interaction.commandName == 'wallet') {
        if (interaction.options._subcommand == 'send') {
            const password = interaction.options.getString('password') + interaction.user.id;
            const receiver = interaction.options.getString('receiver');
            const amount = interaction.options.getString('amount');
            const op_return = interaction.options.getString('op_return'); // undefined (Handled)
            const change_address = interaction.options.getString('change_address'); // undefined (Handled)
            let result = await send_tx(password, receiver, amount, op_return, change_address);
            interaction.reply({ content: result.toString(), ephemeral: true });
        } else if (interaction.options._subcommand == 'help') {
            interaction.reply(help_wallet());
        } else if (interaction.options._subcommand == 'my_address') {
            const password = interaction.options.getString('password') + interaction.user.id;
            const address = new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(password)))).toAddress();
            interaction.reply({ content: 'Address: ' + address, ephemeral: true });
        } else if (interaction.options._subcommand == 'balance') {
            const address_or_password = interaction.options.getString('address_or_password');
            const text = interaction.options.getString('text');
            if (address_or_password == 'password') {
                const password = text + interaction.user.id;
                const address = new garlicore.PrivateKey(garlicore.crypto.BN.fromBuffer(garlicore.crypto.Hash.sha256(Buffer.from(password)))).toAddress();
                const balance = await getBalance(address, grlc_or_tgrlc);
                if (balance.error) {
                    interaction.reply({ content: balance.data, ephemeral: true });
                    return;
                } else {
                    interaction.reply({ content: `**Address:** ${address}\n**Balance:** ${balance.data} ${grlc_or_tgrlc}🧄`, ephemeral: true });
                }
            } else {
                let validated_address = await validateAddress(text);
                if (validated_address.isValid) {
                    let balance = await getBalance(text, grlc_or_tgrlc);
                    if (balance.error) {
                        interaction.reply({ content: balance.data, ephemeral: true })
                    } else {
                        interaction.reply({ content: `**Address:** ${text}\n**Balance:** ${balance.data} ${grlc_or_tgrlc}🧄`, ephemeral: true });
                    };
                } else if (validated_address.error) {
                    interaction.reply({ content: "Something went wrong with the RPC connection. (Bot's fault)", ephemeral: true });
                } else {
                    interaction.reply({ content: "Invalid address", ephemeral: true });
                }
            }
        }
    } else if (interaction.commandName == 'lottery') {
        if (interaction.options._subcommand == 'enter') {
            await interaction.deferReply();
            enterLottery(interaction, interaction.user.id, interaction.options.getString('lottery_number'));
        } else if (interaction.options._subcommand == 'status') {
            statusLottery(interaction, interaction.user.id, interaction.options.getString('lottery'));
        } else if (interaction.options._subcommand == 'win_address') {
            winAddress(interaction, interaction.user.id, interaction.options.getString('address'));
        } else if (interaction.options._subcommand == 'create') {
            const name = interaction.options.getString('name');
            const amount_to_enter = interaction.options.getNumber('amount_to_enter');
            const end_time = interaction.options.getInteger('end_time');
            const win_percentage = interaction.options.getInteger('win_percentage');
            const split_2_name = interaction.options.getString('split_2_name');
            const split_2_percentage = interaction.options.getInteger('split_2_percentage');
            const split_2_address = interaction.options.getString('split_2_address');
            const split_3_name = interaction.options.getString('split_3_name');
            const split_3_percentage = interaction.options.getInteger('split_3_percentage');
            const split_3_address = interaction.options.getString('split_3_address');
            createLottery(interaction, interaction.user.id, name, amount_to_enter, end_time, win_percentage, split_2_name, split_2_percentage, split_2_address, split_3_name, split_3_percentage, split_3_address);
        }
    }
}


// NOT FINISHED
async function autocomplete_commands(interaction) {
    if (interaction.commandName == 'lottery') {
        if (interaction.options._subcommand == 'enter') {
            const focusedValue = interaction.options.getFocused();
            const choices = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']; // Should be a list of lotteryIds
            const filtered = choices.filter(choice => choice.startsWith(focusedValue));
            interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
        } else if (interaction.options._subcommand == 'status') {
            const focusedValue = interaction.options.getFocused();
            const choices = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']; // Should be a list of lotteryIds
            const filtered = choices.filter(choice => choice.startsWith(focusedValue));
            interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
        }
    }
}


async function button_interaction(interaction) {
    confirmLotteryCreation(interaction);
}


export { slash_commands, autocomplete_commands, button_interaction };