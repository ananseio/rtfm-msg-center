#!/bin/bash
#
echo '===== Installing NodeJS and Yarn ====='
curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
apt-get -y update
apt-get -y install yarn build-essential git libudev-dev bluetooth bluez libbluetooth-dev
