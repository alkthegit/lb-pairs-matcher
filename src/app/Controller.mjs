import PairsMatcher, { PairsMatcherEvents } from "./PairsMatcher.mjs";
import { getItemsMap } from "./cardSets/colorCards8.mjs";
import getItems from "./cardSets/colorCards8.mjs";
const GameStates = {
    NotStarted: 'Not started',
    InProgress: 'In progress',
    GameOver: 'Game over',
    Mismatch: 'Mismatch'
}

const appState = {
    gameState: GameStates.NotStarted
}

/**
 * Ссылка на таймер
 * @type {number}
 */
let timerInterval = -1;

/**
 * Время начала игры
 * 
 * @type {Date}
 */
let startTime;

export default class Controller {
    /**
     * Элемет-контейнер для всего веб-приложения. Задается единовременно при создании экземпляра класса
     * 
     * @type {HTMLDivElement}
     * @private
     */
    containerDiv;

    /**
     * Экземпляр управляющего класса для игры (модель)
     * 
     * @type {PairsMatcher} 
     * @private
     */
    pairsMatcher;

    /**
     * Игровая доска внутри контейнера приложения
     * 
     * @type {HTMLDivElement}     * 
     * @private
     */
    boardElement;

    /**
     * Набор объектов внутри игровой доски
     * 
     * @type {HTMLDivElement[]}
     */
    itemsElement;

    /**
     * Текстовое поле с информацией о времени игры
     * 
     * @type {HTMLInputElement}
     * @private
     */
    timeLabelElement

    /**
     * Текущий массив объектов для игры. По умолчанию - цветные карточки
     * 
     * @private
     */
    items = getItems();

    /**
     * Время, прошедшее с начала новой игры, в миллисекундах с шагом 20 мс
     * 
     * @type {number}
     * @private
     */
    elapsedTime;

    /**
     * Конструктор
     * 
     * @param {HTMLDivElement} containerDiv html-элемент-контейнер для всего веб-приложения
     * @param {HTMLDivElement} pairsMatcher Экземпляр управляющего класса для игры (модель)
     */
    constructor(containerDiv, pairsMatcher) {
        if (!containerDiv) {
            throw new Error(`Для контроллера необходимо указать контейнер приложения. Педано значение '${containerDiv}'`);
        }

        if (!pairsMatcher) {
            throw new Error(`Для контроллера необходимо указать экземпляр управляющего класс для игры. Педано значение '${pairsMatcher}'`);
        }

        this.containerDiv = containerDiv;
        this.pairsMatcher = pairsMatcher;

        this.generateViewElements();
        this.bindViewEventListeners();
        // this.startNewGame();
        // console.table(this.items);
        console.log(`Controller initialized`);
    }

    /**
     * Порождает новое игровое поле в контейнере приложения
     * @param {number} pairsCount Количество пар объектов в игре
     */
    startNewGame() {
        const itemsMap = getItemsMap();
        this.pairsMatcher.newGame2(itemsMap)
            .then((itemIds) => {
                // console.table(this.items);

                let itemHTML = '';

                // элемент массива this.items - то есть "физический" объект, участвующий в игре и имеющий свойства - цвет, картинку, форму и т.д.
                let itemGame;

                let itemElementId = '';
                // console.table(this.items);

                this.itemsElement.innerHTML = "";
                // по полученому массиву расстановок объектов порождаем представления объектов на странице
                itemIds.forEach((itemId) => {
                    itemGame = this.items.find(item => item.id === itemId);

                    itemElementId = `item-${itemGame.id}`;
                    itemHTML = `
                        <div class="item facedown" id="${itemElementId}"></div>
                    `;

                    this.itemsElement.insertAdjacentHTML('beforeend', itemHTML);
                });

                this.pairsMatcher.on(PairsMatcherEvents.Active, (itemId) => {
                    console.log('Event: active');
                    // помечаем активированный элемент как активный в представлении
                    let itemElement = this.itemsElement.querySelector(`#item-${itemId}`);
                    itemElement.classList.remove('facedown');
                    itemElement.classList.add('faceup');
                    itemElement.style.backgroundColor = this.items.find((e) => e.id === itemId).color;
                });

                this.pairsMatcher.on(PairsMatcherEvents.Match, (itemIds) => {
                    console.log(`Event: match 😄`);
                    this.items
                        .filter(item => itemIds.includes(item.id))
                        .map(item => item.id)
                        .forEach(itemId => {
                            let itemElement = this.itemsElement.querySelector(`#item-${itemId}`);
                            // setTimeout(100, () => {
                            itemElement.classList.remove('faceup');
                            itemElement.classList.remove('facedown');
                            itemElement.classList.add('match');
                            itemElement.style.backgroundColor = this.items.find((e) => e.id === itemId).color
                            // });
                        })
                });

                this.pairsMatcher.on(PairsMatcherEvents.Mismatch, (itemIds) => {
                    console.log(`Event: mismatch 😔`);
                    setTimeout(() => {
                        this.items
                            .filter(item => itemIds.includes(item.id))
                            .map(item => item.id)
                            .forEach(itemId => {
                                const itemElement = this.itemsElement.querySelector(`#item-${itemId}`);
                                itemElement.classList.remove('faceup');
                                itemElement.style.backgroundColor = '';
                                itemElement.classList.add('facedown');
                            });
                    }, 800);
                });

                this.pairsMatcher.on(PairsMatcherEvents.GameOver, (gameStats) => {
                    clearInterval(timerInterval);

                    console.log(`You win 😎`);
                    appState.gameState = GameStates.GameOver;

                    const gameTime = this.timeLabelElement.value;
                    alert(`Вы выиграли!\n\n\n   Затраченно времени: ${gameTime}\n   Сделано ходов: ${gameStats.tries}`);
                });

                appState.gameState = GameStates.InProgress;
                console.log('Игра началась');

                // показываем отсчет премени на текстовом поле - с шагом 20 мс
                startTime = Date.now();
                this.timeLabelElement.textContent = `00:00.000`;
                timerInterval = setInterval(() => {
                    this.elapsedTime = Date.now() - startTime;
                    const date = new Date(this.elapsedTime);
                    // this.timeLabelElement.textContent = this.elapsedTime;
                    const minutes = `0${date.getMinutes().toString()}`.slice(-2);
                    const seconds = `0${date.getSeconds().toString()}`.slice(-2);
                    const milliseconds = `000${date.getMilliseconds().toString()}`.slice(-3);
                    this.timeLabelElement.value = `${minutes}:${seconds}.${milliseconds}`;
                }, 20);
            });
    }

    /**
     * Создает и связывает элементы представления (интерфейса) с внутренними структурами
     */
    generateViewElements() {
        // игровая доска
        const boardHTML = `<div class="board"></div>`;
        this.containerDiv.insertAdjacentHTML("afterbegin", boardHTML);
        this.boardElement = this.containerDiv.querySelector(".board");

        // набор объектов
        const itemsHTML = `<div class="items"></div>`;
        this.boardElement.insertAdjacentHTML("afterbegin", itemsHTML);
        this.itemsElement = this.containerDiv.querySelector('.items');

        let viewHTML;
        // кнопка Новая игра и поле со временем игры
        viewHTML = `
            <button>Новая игра</button> <input type="text" id="timeLabel" readonly>
        `;
        this.boardElement.insertAdjacentHTML('afterbegin', viewHTML);
        this.timeLabelElement = this.containerDiv.querySelector('#timeLabel');
    }

    /**
     * Назначает обработчики событий для элементов представления (события интерфейса)
     * @private
     */
    bindViewEventListeners() {
        this.itemsElement.addEventListener('click', (event) => {
            // если игра окончена, то ничего не делаем
            if (appState.gameState === GameStates.GameOver) {
                return;
            }

            if (event.target.classList.contains('item')) {
                const itemId = +event.target.id.split('-')[1];
                this.selectItem(itemId);
            }
        });

        const buttonElement = this.boardElement.querySelector('button');
        buttonElement.addEventListener('click', () => {
            this.startNewGame();
        });
    }

    /**
     * Переводит выбранный объект в состояние "выбран"
     * @param {number} id id выбранного объекта
     */
    selectItem(id) {
        this.pairsMatcher.selectItem(id);
    }
}