# Bench-network

./env.sh - клоним репу с фабриком в хомяк нынешнего пользователя, скачиваем images для докера, раскладываем код и скриптик для поднятия сети в репе фабрики

$HOME/fabric-samples/bench - здесь лежит код и скрипт для запуска сети

ubuntu@smartair-test:~/fabric-samples/bench$ ./start.sh - поднимается минимальный набор с 2мя организациями, у каждой по 2 пира, ордерер и cli, устанавливается контракт bench_chaincode

ubuntu@smartair-test:~/fabric-samples/bench$ cd javascript/

ubuntu@smartair-test:~/fabric-samples/bench/javascript$ npm install

Регистрируем админа и пользователя:
ubuntu@smartair-test:~/fabric-samples/bench/javascript$ node enrollAdmin.js
ubuntu@smartair-test:~/fabric-samples/bench/javascript$ node registerUser.js

Для создания объектов:
ubuntu@smartair-test:~/fabric-samples/bench-/javascript$ node generate.js <Кол-во объектов>
Также в текущей директории создается файлик  SOME_TIMESTAMP_GENERATED.json в котором лежат все объекты, добавленные в леджер

Все остальные js скрипты запускаются без параметров, также создают json-файлы с объектами (все объекты в леджере для query.js и все продленные объекты для prolong.js)

ВАЖНО: 
используем ./clear.sh перед каждым запуском/перезапуском сети

для просмотра логов чеинкода используем docker logs -f CONTAINER_NAME, обычно имя есть что-то по типу dev.org1.peer0... и т.д

