set -e

rm -rf ./javascript/wallet/*
node ./javascript/clear.js
docker rm -f $(docker ps -aq)
docker rmi -f $(docker images | grep meter | awk '{print $3}')

