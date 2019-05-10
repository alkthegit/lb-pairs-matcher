import PairsMatcher, { PairsMatcherEvents } from "./PairsMatcher.mjs";

import ColorCards8 from "./cardSets/colorCards8.mjs";

const GameStates = {
    NotStarted: 'Not started',
    InProgress: 'In progress',
    GameOver: 'Game over',
    Mismatch: 'Mismatch'
}

const appState = {
    gameState: GameStates.NotStarted
}
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
     * @private
     * @type {PairsMatcher} 
     */
    pairsMatcher;

    /**
     * Игровая доска внутри контейнера приложения
     * @type {HTMLDivElement}
     */
    boardElement;

    /**
     * Набор объектов внутри игровой доски
     * @type {HTMLDivElement}
     */
    itemsElement;

    /**
     * Текущий массив объектов для игры. По умолчанию - цветные карточки
     */
    items = ColorCards8.getItems();

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

        this.generateViewItems();
        this.bindViewEventListeners();
        this.startNewGame();
        console.log(`Controller initialized`);
    }

    /**
     * Порождает новое игровое поле в контейнере приложения
     * @param {number} pairsCount Количество пар объектов в игре
     */
    startNewGame() {
        const pairsCount = this.items.lengh;

        this.pairsMatcher.newGame(pairsCount)
            .then((itemsInfo) => {
                // console.table(this.items);

                let itemHTML = '';

                // элемент массива this.items - то есть "физический" объект, участвующий в игре и имеющий свойства - цвет, картинку, форму и т.д.
                let itemGame;

                let itemElementId = '';
                // console.table(this.items);

                this.itemsElement.innerHTML = "";
                // по полученому массиву расстановок объектов порождаем представления объектов на странице
                itemsInfo.forEach((itemInfo) => {
                    itemGame = this.items[itemInfo.itemIndex];

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

                this.pairsMatcher.on(PairsMatcherEvents.GameOver, () => {
                    console.log(`You win 😎`);
                    appState.gameState = GameStates.GameOver;
                });

                appState.gameState = GameStates.InProgress;
                console.log('Игра началась')
            });
    }

    /**
     * Создает и связывает элементы представления (интерфейса) с внутренними структурами
     */
    generateViewItems() {
        const boardHTML = `<div class="board"></div>`;
        this.containerDiv.insertAdjacentHTML("afterbegin", boardHTML);
        this.boardElement = this.containerDiv.querySelector(".board");

        const itemsHTML = `<div class="items"></div>`;
        this.boardElement.insertAdjacentHTML("afterbegin", itemsHTML);
        this.itemsElement = this.containerDiv.querySelector('.items');

        // кнопка Новая игра
        const viewHTML = `
            <button>Новая игра</button>
        `;
        this.boardElement.insertAdjacentHTML('afterbegin', viewHTML);
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