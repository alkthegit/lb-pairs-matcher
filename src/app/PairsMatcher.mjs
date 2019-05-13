/**
 * Список событий, испускаемых моделью
 * @readonly
 * @enum
 */
export const PairsMatcherEvents = {
    // gameStart: 'gameStart',
    GameOver: 'Game over',
    Match: 'Match',
    Mismatch: 'Mismatch',
    Active: 'Active',
    Inactive: 'Inactive'
}

/**
 * Информаця об объекте игры во внутреннем представлении модели
 * @typedef {Object} ItemInfo
 * @property {number} id Уникальный идентификатор объекта в наборе пар
 * @property {number} pairId Уникальный идентификатор пары в наборе пар
 */

/**
 * Класс, представляющий статистику игры в ходе игры и по ее завершении
 *
 * @class 
 */
class GameStats {
    /**
     * Время начала игры
     * 
     * @type {Date}
     */
    startDate;

    /**
     * Время завершения игры
     * 
     * @type {Date}
     */
    endDate;

    /**
     * Количество миллисекунд, прошедших с начала игры startDate до конца игры endDate
     * 
     * @type {number}
     */
    milliseconds = 0;

    /**
     * Количество попыток (одна попытка - это попытка отдагать одну пару)
     * 
     * @type {number}
     */
    tries = 0;
}

/**
 * @typedef ItemState
 */

/**
 * @readonly
 * @enum {ItemState}
 */
const ItemState = {
    active: 'active',
    inactive: 'inactive',
    match: 'match'
}

class Item {
    /**
     * Идентификатор объекта в массиве подобных объектов
     * "@type {number}
     */
    id;

    /**
     * Состояние объекта: активен, неактивен, угадан
     * @type {ItemState}
     */
    state;

    /**
     * Идентификатор пары для объекта в общем массиве подобных объектов
     * @type {number}
     */
    pairId;

    constructor(id, state, pairId) {
        this.id = id;
        this.state = state;
        this.pairId = pairId;
    }
}

export default class PairsMatcher {
    /**
     * Статистика игры
     * @type {GameStats} 
     * @private
     */
    gameStats = undefined;

    /**
     * Количество пар объектов в игре
     * @type {number}
     * @private
     */
    pairsCount = 0;

    /**
     * Количество пар, которые еще необходимо угадать. Если становится равно 0 - все пары угаданы
     * @type {number}
     */
    pairsToMatch = -1;

    /**
     * Массим объектов текущей игры
     * @type {Item[]}
     * @private
     */
    items = [];

    /**
     * Последовательность ходов, ведущая к победе - упорядоченный массив идентификаторов объектов в порядке угадывания
     * 
     * @type {number[]}
     */
    winStrategy = [];

    /**
     * индекс выбранного в настоящий момент и еще не угаданные объект из массива объектов
     * @type {number}
     * @private
     */
    selectedItemId = -1;

    /**
    * Подписчики событий
    * @type 
    */
    eventListeners = {};

    constructor() {
        window.selectPMItem = this.selectItem.bind(this);
    }

    /**
     * Начинает новую игру "Найди пару"
     * @param {ItemInfo[]} itemsMap Исходная раскладка объектов в наборе объектов - для последующего размещения на игровом поле
     * @return {Promise<number[]>} - Массив перемешанных идентификаторов из массива itemsMap для раскладки в новой игре
     */
    newGame(itemsMap) {
        return new Promise((resolve, reject) => {
            try {
                if (!itemsMap || itemsMap.length === 0) {
                    throw new Error(`Необходимо передать исходную раскладку объектов, получено значение: '${itemsMap}'`);
                }

                if (itemsMap.length % 2 !== 0) {
                    throw new Error(`Число объектов в наборе должно быть четный, передано значение: '${itemsMap}'`);
                }

                this.items = [];
                let itemIds = [];

                // на основе исходного набора объектов заполняем внутренний массив
                itemsMap.forEach((item) => {
                    this.items.push(new Item(item.id, ItemState.inactive, item.pairId));
                });

                /* заполняем последовательность ходов (id объектов, ведущую к победе)
                    для этого упорядочиваем массив объектов по ключу (pairId, id)
                */
                this.winStrategy = [...this.items]
                    .map(item => {
                        return { id: item.id, pairId: item.pairId }
                    })
                    .sort((prev, next) => {
                        if (prev.pairId < next.pairId) {
                            return -1;
                        }

                        if (prev.pairId > next.pairId) {
                            return 1;
                        }

                        if (prev.pairId === next.pairId) {
                            if (prev.id < next.id) {
                                return -1;
                            }
                            if (prev.id > next.id) {
                                return 1;
                            }

                            // в теории невозможный случай, когда идентификатор объекта не уникальный в наборе объектов
                            return 0;
                        }
                        // в теории невозможный случай, когда идентификатор пары объектов не уникальный в наборе пар
                        return 0;
                    });

                // предварительно готовим массив идентификатором исходного набора
                itemIds = itemsMap.map((e) => e.id);

                // перемешиваем массив ItemIds алгоритмом Фишера-Йейтса
                let rnd = -1;
                for (let i = itemIds.length - 1; i >= 1; i--) {
                    rnd = Math.trunc(Math.random() * (i + 1));
                    if (rnd !== i) {
                        [itemIds[rnd], itemIds[i]] = [itemIds[i], itemIds[rnd]];
                        [this.items[rnd], this.items[i]] = [this.items[i], this.items[rnd]];
                    }
                }

                const pairsCount = itemsMap.length / 2;
                this.pairsCount = pairsCount;
                this.pairsToMatch = pairsCount;
                this.resetGameStats();

                // на выходе получился массив с перемешанными позициями исходного массива. Клиент данного метода
                // может обращаться к своему исходному массиву при помощи данного набора: Исходный_массив[itemIndexes[index]]
                resolve(itemIds);
            }
            catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Активирует элемент массива объектов по указанному индексу в массиве.
     * Так же проверяет, не был ли уже активирован объект-пара. Если был, то помечает объекты угаланными и испускает событие PairsMatcherEvents.match
     * @param {number} id идентификатор выбранного элемента
     */
    selectItem(id) {
        // находим новый выбранный объект во внутреннем массиве
        const item = this.items.find(e => e.id === id);

        // уже выранный, то есть текущий активный элемент (если он ране был выбран)
        let selectedItem;

        // если данный объект уже был отгадан или активирован, то ничего не делаем
        if (item.state !== ItemState.inactive) {
            return;
        }

        /*  сверяем с выбранным ранее объектом, если он был выбран */
        if (this.selectedItemId !== -1) {
            // выбранный ранее объект
            selectedItem = this.items.find(e => e.id === this.selectedItemId);

            if (selectedItem.pairId === item.pairId) {
                // если это - одна пара - помечаем их как угаанные и отправляем событие с индексом пары
                item.state = selectedItem.state = ItemState.match;
                this.selectedItemId = -1;
                this.emit(PairsMatcherEvents.Active, item.id);
                this.emit(PairsMatcherEvents.Match, [selectedItem.id, item.id]);

                this.pairsToMatch--;
                if (this.pairsToMatch === 0) {
                    // если все пары угаданы, то отправляем соответствующее событие
                    this.endGame();
                    const gameStats = this.getGameStats();
                    setTimeout(() => {
                        this.emit(PairsMatcherEvents.GameOver, gameStats);
                    }, 0);
                }
            }
            else {
                // иначе помечаем обоих как неактивные и отправляем событие с индексом пары
                item.state = selectedItem.state = ItemState.inactive;
                this.emit(PairsMatcherEvents.Active, item.id);
                this.emit(PairsMatcherEvents.Mismatch, [selectedItem.id, item.id]);
                this.selectedItemId = -1;
            }
        }
        else {
            // это первый объект, который выбрали
            this.selectedItemId = item.id;
            item.state = ItemState.active;
            this.emit(PairsMatcherEvents.Active, item.id);
            this.gameStats.tries++;
        }
        // console.table(this.items);
    }

    /**
     * Предоставляет статистику о текущей игре
     */
    getGameStats() {
        return {
            ...this.gameStats
        }
    }

    /**
     * Завершает игру
     */
    endGame() {
        this.gameStats.endDate = Date.now();
        this.gameStats.milliseconds = this.gameStats.endDate - this.gameStats.startDate;
    };

    /**
     * Сбрасывает статистику игры
     * @private
     */
    resetGameStats() {
        this.gameStats = new GameStats();
        this.gameStats.startDate = Date.now();
    }

    /**
     * Подписываться на события класса (из перечисления PairsMatcherEvents)
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * Испускает событие (из перечисления PairsMatcherEvents)
     * @param event 
     */
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach((callback) => {
                callback(data);
            });

        }
    };

    /**
     * Возвращает последовательность ходов (id объектов), ведущую к победе
     * 
     * @public
     * @return {number[]}
     */
    getWinStrategy() {
        return [...this.winStrategy];
    }


}





// создаем перечисление по аналогии с тем, как это делает компилятор TypeScript
/**
 * Возможные события, испускаемые моделью
 * @/readonly
 * @/enum {string}
 */
/* let PairsMactherEvents;
((variable) => {
    variable[variable[0] = 'gameStart'] = 0;
    variable[variable[1] = 'gameOver'] = 1;
    PairsMactherEvents = variable;
})(PairsMactherEvents || {});

export { PairsMactherEvents }; */