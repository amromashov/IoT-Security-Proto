set -ev
# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
docker-compose -f docker-compose-peers.yml up -d peer6.org1.example.com couchdb6 peer7.org1.example.com couchdb7 peer8.org1.example.com couchdb8
export FABRIC_START_TIMEOUT=10
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}
# Create the channel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer6.org1.example.com peer channel fetch config -o orderer0.example.com:7050 -c mychannel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer6.org1.example.com peer channel join -b mychannel_config.block

docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer7.org1.example.com peer channel fetch config -o orderer0.example.com:7050 -c mychannel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer7.org1.example.com peer channel join -b mychannel_config.block

docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer8.org1.example.com peer channel fetch config -o orderer0.example.com:7050 -c mychannel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer8.org1.example.com peer channel join -b mychannel_config.block
