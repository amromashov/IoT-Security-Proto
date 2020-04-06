set -e

rm -rf ./javascript/wallet/*
docker rm -f $(docker ps -aq)
docker rmi -f $(docker images | grep bench | awk '{print $3}')
