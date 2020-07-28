#!/bin/sh
yarn install
yarn build

source ./.env

# Starting the bot.
PID="$(sh -c 'echo $$; exec yarn start >./.log 2>&1' &)"
echo "$PID" > ./.pid

