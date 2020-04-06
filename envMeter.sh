#!/bin/bash

set -ev

cd $HOME
curl -sSL http://bit.ly/2ysbOFE | bash -s -- 1.4.3 1.4.3 0.4.15

cd $OLDPWD

cp -r ./meter $HOME/fabric-samples/
cp -r ./meter_chaincode $HOME/fabric-samples/chaincode/
