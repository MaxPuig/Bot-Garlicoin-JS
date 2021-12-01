const wallet = {
    name: 'wallet',
    description: 'Send tGRLC.',
    options: [{
        name: 'send',
        description: 'Send GRLC to someone.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'password',
            description: 'Password you used to create the wallet.',
            type: 'STRING',
            required: true,
        }, {
            name: 'receiver',
            description: 'Address where you want to send the GRLC.',
            type: 'STRING',
            required: true
        }, {
            name: 'amount',
            description: 'How much you want to send. **Dot** for decimal place.',
            type: 'STRING',
            required: true
        }, {
            name: 'op_return',
            description: '(Optional) Message that will be included in the block. (max 80 chars)',
            type: 'STRING',
            required: false
        }, {
            name: 'change_address',
            description: '(Optional) Where the rest of the coins will go. (Blank = Sender)',
            type: 'STRING',
            required: false
        }]
    }, {
        name: 'my_address',
        description: 'Get the address corresponding to your password.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'password',
            description: 'Password you used to create the wallet.',
            type: 'STRING',
            required: true,
        }]
    }, {
        name: 'balance',
        description: 'Get the balance of an address or the one related to your password.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'address_or_password',
            description: 'Will it be an address or a password?',
            type: 'STRING',
            required: true,
            choices: [{
                name: 'address',
                value: 'address'
            }, {
                name: 'password',
                value: 'password'
            }]
        }, {
            name: 'text',
            description: 'The address or your password.',
            type: 'STRING',
            required: true
        }]
    }, {
        name: 'help',
        description: 'More info on how this works.',
        type: 'SUB_COMMAND'
    }]
}


const lottery = {
    name: 'lottery',
    description: 'Demonstration lottery GRLC system.',
    options: [{
        name: 'enter',
        description: 'Enter the demonstration lottery.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'lottery_number',
            description: 'What lottery do you want to participate in?',
            type: 3, // String
            autocomplete: true,
            required: true
        }],
    }, {
        name: 'status',
        description: 'Enter the demonstration lottery.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'lottery',
            description: 'What lottery do you want to get the stats from?',
            type: 3, // String
            autocomplete: true,
            required: true
        }],
    }, {
        name: 'win_address',
        description: 'Enter the address where you want the prize to go to.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'address',
            description: 'Address where you want the prize to go to.',
            type: 'STRING',
            required: true,
        }],
    }, {
        name: 'create',
        description: 'Create a lottery.',
        type: 'SUB_COMMAND',
        options: [{
            name: 'name',
            description: 'Name of the lottery.',
            type: 'STRING',
            required: true,
        }, {
            name: 'amount_to_enter',
            description: 'Price to participate.',
            type: 'NUMBER',
            required: true,
        }, {
            name: 'end_time',
            description: 'Time when the lottery finishes. UNIX TIMESTAMP.',
            type: 'INTEGER',
            min_value: 1_637_967_599, // 26/11/2021
            max_value: 1_924_988_399, // 31/12/2030
            required: true,
        }, {
            name: 'win_percentage',
            description: 'Integer. Out of 100, what percentage will the winner get?',
            type: 'INTEGER',
            min_value: 0,
            max_value: 100,
            required: true,
        }, {
            name: 'split_2_name',
            description: 'If the prize is split, what is the name of destination? Example: Airdrop Fund.',
            type: 'STRING',
            required: false,
        }, {
            name: 'split_2_percentage',
            description: 'Integer. Out of 100, what percentage does this address get. Must add 100 with the winner.',
            type: 'INTEGER',
            min_value: 0,
            max_value: 100,
            required: false,
        }, {
            name: 'split_2_address',
            description: 'Address where the split will go.',
            type: 'STRING',
            required: false,
        }, {
            name: 'split_3_name',
            description: 'If the prize is split, what is the name of destination? Example: Community Fund.',
            type: 'STRING',
            required: false,
        }, {
            name: 'split_3_percentage',
            description: 'Integer. Out of 100, what percentage does this address get. Must add 100 with the winner.',
            type: 'INTEGER',
            min_value: 0,
            max_value: 100,
            required: false,
        }, {
            name: 'split_3_address',
            description: 'Address where the split will go.',
            type: 'STRING',
            required: false,
        }],
    }]
};


const all_commands_array = [lottery, wallet];
export { all_commands_array }