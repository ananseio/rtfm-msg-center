NODE_VERSION=8

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install $NODE_VERSION
nvm use $NODE_VERSION

echo '===== Installing nodeJS support tools ====='
echo "NodeJS Version: `node -v`"
echo "NPM Version: `npm -v`"
echo "Yarn Version: `yarn --version`"
npm install -g typescript bunyan
