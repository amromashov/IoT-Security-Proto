set -ev
# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
docker-compose -f docker-compose-peers.yml up -d peer3.org1.example.com couchdb3 peer4.org1.example.com couchdb4 peer5.org1.example.com couchdb5
export FABRIC_START_TIMEOUT=10
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}
# Create the channel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer3.org1.example.com peer channel fetch config -o orderer0.example.com:7050 -c mychannel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer3.org1.example.com peer channel join -b mychannel_config.block

docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer4.org1.example.com peer channel fetch config -o orderer0.example.com:7050 -c mychannel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer4.org1.example.com peer channel join -b mychannel_config.block

docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer5.org1.example.com peer channel fetch config -o orderer0.example.com:7050 -c mychannel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer5.org1.example.com peer channel join -b mychannel_config.block
