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
 * @property {number} id Индекс объекта во внутреннем представлении модели
 * @property {number} order Порядковый номер объекта во внутреннем представлении модели. При начале новой игры все пары "перемешиваются", при этом данное значение соответствует условному положению объекта в интерфейсе пользователя. Контроллер интерфейса сам решает, каким образом использовать данный порядок, например, просто выбрать по данному значению элемент индекса з массива объектов игры: gameCards[order] 
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
    endDate = undefined;

    /**
     * Количество миллисекунд, пршедших с начала игры startDate до конца игры endDate
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
     * @param {number} pairsCount Количество пар в новой игре
     * @return {Promise<ItemInfo[]>} - информация об объектах новой игры
     */
    newGame(pairsCount = 8) {
        return new Promise((resolve, reject) => {
            try {
                if (typeof pairsCount !== 'number') {
                    throw new Error(`Необходимо передать целое значение, получено значение '${pairsCount}'`);
                }

                // оставляем только целую часть
                pairsCount = Math.trunc(pairsCount);

                if (pairsCount <= 0) {
                    throw new Error(`Необходимо передать значение, большее нуля, получено значение '${pairsCount}'`);
                }

                this.items = [];
                let itemsInfo = [];

                // заполняем начальный массив объектов - просто ставим по порядку все пары рядом в одном массивы и индексируем элементы "насквозь" от 0 до pairsCount*2-1 
                let itemId = 0;
                for (let pairId = 0; pairId < pairsCount; pairId++) {
                    // добавляем иформацию в выходной массив
                    itemsInfo.push({
                        itemIndex: itemId,
                        pairId
                    });

                    // добавляем информаию во внутреннее представление
                    this.items.push(new Item(itemId, ItemState.inactive, pairId));

                    itemId++

                    // добавляем иформацию в выходной массив
                    itemsInfo.push({
                        itemIndex: itemId,
                        pairId
                    });

                    // добавляем информаию во внутреннее представление
                    this.items.push(new Item(itemId, ItemState.inactive, pairId));

                    itemId++
                }

                // перемешиваем массив itemsInfo алгоритмом Фишера-Йейтса
                let rnd = -1;
                for (let i = itemsInfo.length - 1; i >= 1; i--) {
                    rnd = Math.trunc(Math.random() * (i + 1));
                    if (rnd !== i) {
                        [itemsInfo[rnd], itemsInfo[i]] = [itemsInfo[i], itemsInfo[rnd]];
                        [this.items[rnd], this.items[i]] = [this.items[i], this.items[rnd]];
                    }
                }

                this.pairsCount = pairsCount;
                this.pairsToMatch = pairsCount;
                this.resetGameStats();

                resolve(itemsInfo);
            }
            catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Активирует элемент массива объектов по указанному индексу в массиве.
     * Так же проверяет, не был ли уже активирован объект-пара. Если был, то помечает объекты угаланными и испускает событие PairsMatcherEvents.match
     * @param {number} index
     */
    selectItem(id) {
        // находим выбранный объект во внутреннем массиве
        const item = this.items.find(e => e.id === id);


        let selectedItem;
        // если данный объект уже был отгадан или активирован, то ничего не делаем
        if (item.state !== ItemState.inactive) {
            console.log(`указанный объект id=${id} уже показан или угадан, ничего не делаем`);
            return;
        }

        // console.log(`активный элемент: ${this.selectedItemId}; выбранный элемент: ${item.id}`);


        /*  сверяем с выбранным ранее объектом, если он был выбран */
        if (this.selectedItemId !== -1) {
            // выбранный ранее объект
            selectedItem = this.items.find(e => e.id === this.selectedItemId);

            if (selectedItem.pairId === item.pairId) {
                // если это - одна пара - помечаем их как угаанные и отправляем событие с индексом пары
                item.state = selectedItem.state = ItemState.match;
                this.selectedItemId = -1;
                this.emit(PairsMatcherEvents.Match, [selectedItem.id, item.id]);

                this.pairsToMatch--;
                if (this.pairsToMatch === 0) {
                    // если все пары угаданы, то отправляем соответствующее событие
                    this.endGame();
                    this.emit(PairsMatcherEvents.GameOver);
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
            this.selectedItemId = item.id;
            item.state = ItemState.active;
            this.emit(PairsMatcherEvents.Active, item.id);
        }
        // console.table(this.items);
    }

    /**
     * Предоставляет статистику о текущей игре
     */
    getGameStats() {

    }

    /**
     * Завершает игру
     */
    endGame() {
        this.gameStats.endDate = Date.now();
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

    // УБРАТЬ - ДЛЯ ТЕСТА
    getItems() {
        return [...this.items];
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