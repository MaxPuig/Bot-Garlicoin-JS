# Bot-Garlicoin-JS
Discord bot that sends info about garlicoin and user's wallets

# Commands
- !prefix --> Changes the prefix of commands. ("!" by default) (Only triggerable by Server Admins)
- !price --> Current price of GRLC. Also accepts !price {other currency} --> !price eur
- !register {Address} --> Saves user address to userWallets.json (!register forget --> to remove the address from the file)
- !info --> Info about pool / (pool+user if registered)
- !balance --> Balance of registered wallet. Also accepts !balance {other currency} --> !balance eur

# SETUP
- install node.js
  - Linux:
  ```
  sudo apt update
  sudo apt install nodejs
  sudo apt install npm
  sudo npm cache clean -f
  sudo npm install -g n
  sudo n stable
  ```
  - Windows/macOS: https://nodejs.org/es/download/

- clone repository: `git clone https://github.com/MaxPuig/Bot-Garlicoin-JS.git`
- Download needed packages: `npm install`
- create ".env" file like follows:
  ```
  TOKENDISCORD = 'YourToken'
  TOKENCMC = 'CoinMarketCapToken'
  ```
-  Run bot `node bot.js`
