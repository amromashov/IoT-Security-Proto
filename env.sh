#!/bin/bash

set -ev

cd $HOME
curl -sSL http://bit.ly/2ysbOFE | bash -s

cd $OLDPWD

cp -r ./bench $HOME/fabric-samples
cp -r ./bench_chaincode $HOME/fabric-samples/chaincode/
