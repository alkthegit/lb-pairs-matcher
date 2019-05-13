import PairsMatcher, { PairsMatcherEvents } from "./PairsMatcher.mjs";
import { getItemsMap } from "./cardSets/colorCards8.mjs";
import getItems from "./cardSets/colorCards8.mjs";

const GameStates = {
  NotStarted: "Not started",
  InProgress: "In progress",
  GameOver: "Game over",
  Mismatch: "Mismatch",
  Cheating: "Cheating",
  Showing: "Showing"
};

/**
 * Текущее состояние приложения
 */
const appState = {
  /**
   * Состояние игры
   *
   * @type {GameStates}
   */
  gameState: GameStates.NotStarted,

  /**
   * Текущее количество показанных несовпавших объектов. Нужно чтобы перевести состояние игры в GameStats.Showing и обратно при завершении показа несовпавших карточек. Меняется на 2 и в обратном порядке до 0 в обработчике события Controller.onItemsMismatch
   *
   * @type {number}
   */
  mismatchCount: 0,

  /**
   * Множество идентификаторов угаданных объектов.
   * Используется, например, при включении режима "Сдаюсь", чтобы не выбирать уже угаданные пользователем объекты
   *
   * @type {number[]}
   */
  matchIds: []
};

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
   * Конструктор
   *
   * @param {HTMLDivElement} containerDiv html-элемент-контейнер для всего веб-приложения
   * @param {HTMLDivElement} pairsMatcher Экземпляр управляющего класса для игры (модель)
   */
  constructor(containerDiv, pairsMatcher) {
    if (!containerDiv) {
      throw new Error(
        `Для контроллера необходимо указать контейнер приложения. Педано значение '${containerDiv}'`
      );
    }

    if (!pairsMatcher) {
      throw new Error(
        `Для контроллера необходимо указать экземпляр управляющего класс для игры. Педано значение '${pairsMatcher}'`
      );
    }

    this.containerDiv = containerDiv;
    this.pairsMatcher = pairsMatcher;

    /**
     * Игровая доска внутри контейнера приложения
     *
     * @type {HTMLDivElement}
     * @private
     */
    this.boardElement;

    /**
     * Набор объектов внутри игровой доски
     *
     * @type {HTMLDivElement[]}
     */
    this.itemsElement;

    /**
     * Текстовое поле с информацией о времени игры
     *
     * @type {HTMLInputElement}
     * @private
     */
    this.timeLabelElement;

    /**
     * Кнопка Начать игру
     *
     * @type {HTMLButtonElement}
     * @private
     */
    this.startGemaButtonElement;

    /**
     * Кнопка Сдаюсь
     *
     * @type {HTMLButtonElement}
     * @private
     */
    this.giveUpButtonElement;

    /**
     * Текущий массив объектов для игры. По умолчанию - цветные карточки
     *
     * @private
     */
    this.items = getItems();

    /**
     * Время, прошедшее с начала новой игры, в миллисекундах с шагом 20 мс
     *
     * @type {number}
     * @private
     */
    this.elapsedTime;
  }

  initialize() {
    this.generateViewElements();
    this.bindViewEventListeners();
    this.bindModelListeners();
    console.log(`Controller initialized`);
  }

  /**
   * Порождает новое игровое поле в контейнере приложения
   * @param {number} pairsCount Количество пар объектов в игре
   */
  startNewGame() {
    const itemsMap = getItemsMap();
    this.pairsMatcher.newGame(itemsMap).then(itemIds => {
      // console.table(this.items);

      let itemHTML = "";

      // элемент массива this.items - то есть "физический" объект, участвующий в игре и имеющий свойства - цвет, картинку, форму и т.д.
      let itemGame;

      let itemElementId = "";
      // console.table(this.items);

      this.itemsElement.innerHTML = "";
      // по полученому массиву расстановок объектов порождаем представления объектов на странице
      itemIds.forEach(itemId => {
        itemGame = this.items.find(item => item.id === itemId);

        itemElementId = `item-${itemGame.id}`;
        itemHTML = `
                        <div class="item facedown" id="${itemElementId}"></div>
                    `;

        this.itemsElement.insertAdjacentHTML("beforeend", itemHTML);
      });

      appState.gameState = GameStates.InProgress;
      appState.matchIds = [];
      console.log("Игра началась");

      // показываем отсчет премени на текстовом поле - с шагом 20 мс
      startTime = Date.now();
      this.timeLabelElement.textContent = `00:00.000`;
      timerInterval = setInterval(() => {
        this.elapsedTime = Date.now() - startTime;
        const date = new Date(this.elapsedTime);
        // this.timeLabelElement.textContent = this.elapsedTime;
        const minutes = `0${date.getMinutes().toString()}`.slice(-2);
        const seconds = `0${date.getSeconds().toString()}`.slice(-2);
        const milliseconds = `000${date.getMilliseconds().toString()}`.slice(
          -3
        );
        this.timeLabelElement.value = `${minutes}:${seconds}.${milliseconds}`;
      }, 20);
      this.toggleElementDisabled(this.startGameButtonElement);
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
    this.itemsElement = this.containerDiv.querySelector(".items");

    let viewHTML;
    // кнопка Новая игра и поле со временем игры
    viewHTML = `
            <div class="tools-row">
                <button id="startGame">Новая игра</button> <input type="text" id="timeLabel" readonly>
            </div>
            <div class="tools-row">
                <button id="giveUp">Сдаюсь!</button>
            </div>
        `;
    this.boardElement.insertAdjacentHTML("afterbegin", viewHTML);

    this.startGameButtonElement = this.boardElement.querySelector(`#startGame`);
    this.giveUpButtonElement = this.boardElement.querySelector(`#giveUp`);

    this.timeLabelElement = this.containerDiv.querySelector("#timeLabel");
  }

  /**
   * Назначает обработчики событий для элементов представления (события интерфейса)
   *
   * @private
   */
  bindViewEventListeners() {
    this.itemsElement.addEventListener("click", event => {
      // если игра окончена, то ничего не делаем
      if (appState.gameState === GameStates.GameOver) {
        return;
      }

      // если идет показ правильных ходов - то ничего не делаем
      if (appState.gameState === GameStates.Cheating) {
        return;
      }

      if (event.target.classList.contains("item")) {
        const itemId = +event.target.id.split("-")[1];
        this.selectItem(itemId);
      }
    });

    let element;
    // Кнопка Начать игру
    element = this.boardElement.querySelector("button#startGame");
    element.addEventListener("click", this.onStartGame);

    // Кнопка Сдаюсь
    element = this.boardElement.querySelector("button#giveUp");
    element.addEventListener("click", this.onGiveUp);
  }

  /**
   * Назначает обработчики событий модели
   *
   * @private
   */
  bindModelListeners(){
    this.pairsMatcher.on(PairsMatcherEvents.Active, this.onItemActivate);
    this.pairsMatcher.on(PairsMatcherEvents.Match, this.onItemsMatch);
    this.pairsMatcher.on(PairsMatcherEvents.Mismatch, this.onItemsMismatch);
    this.pairsMatcher.on(PairsMatcherEvents.GameOver, this.onGameOver);
  };

  /**
   * Переводит выбранный объект в состояние "выбран"
   * @param {number} id id выбранного объекта
   */
  selectItem(id) {
    this.pairsMatcher.selectItem(id);
  }

  /**
   * Обработчик события "объект активирован"
   *
   * @private
   */
  onItemActivate = (itemId) => {
    console.log("Event: active");

    // помечаем активированный элемент как активный в представлении
    this.setItemActivated(itemId);

    // отключаем кнопку сдаюсь пока не хавершен ход
    this.toggleElementDisabled(this.giveUpButtonElement, true);
  };

  /**
   * Обработчик события "Совпадение!"
   *
   * @private
   */
  onItemsMatch = (itemIds) => {
    console.log(`Event: match 😄`);

    // помечаем активированный элементы как угаданные
    this.setItemsMatch(itemIds);

    // включаем кнопку сдаюсь
    this.toggleElementDisabled(this.giveUpButtonElement, false);
  };

  /**
   * Обработчик события "Несовпадение!"
   *
   * @private
   */
  onItemsMismatch = (itemIds) => {
    console.log(`Event: mismatch 😔`);

    // помечаем активированный элементы как неугаданные
    this.setItemsMismatch(itemIds);

    // включаем кнопку сдаюсь
    this.toggleElementDisabled(this.giveUpButtonElement, false);
  };

  /**
   * Обработчик события "игра окончена"
   *
   * @private
   */
  onGameOver = (gameStats) => {
    clearInterval(timerInterval);

    console.log(`Event: you win 😎`);
    appState.gameState = GameStates.GameOver;

    const gameTime = this.timeLabelElement.value;

    /* Ждем завершения текущей игровой динамики */
    const interval = setInterval(() => {
      console.log(appState.gameState);
      if (appState.gameState !== GameStates.GameOver) {
        return;
      }
      clearInterval(interval);
      console.log(`alert`);
      alert(
        `Вы выиграли!\n\n\n   Затраченно времени: ${gameTime}\n   Сделано ходов: ${
          gameStats.tries
        }`
      );
    }, 100);

    this.toggleElementDisabled(this.startGameButtonElement);
  };

  /**
   * Обработчик события "Кнопка Начать игру нажата"
   *
   * @private
   */
  onStartGame = () => {
    this.startNewGame();
  };

  /**
   * Обработчик события "Кнопка Сдаюсь нажата"
   *
   * @private
   */
  onGiveUp = () => {
    if (appState.gameState !== GameStates.InProgress) {
      return;
    }

    appState.gameState = GameStates.Cheating;
    const winStrategy = this.pairsMatcher.getWinStrategy();
    winStrategy
      // берем только неугаданные
      .filter(e => !appState.matchIds.includes(e.id))
      //активируем их в нужном порядке
      .forEach((e, i) => {
        setTimeout(() => {
          this.selectItem(e.id);
        }, i * 200);
      });
  };

  /**
   * Управляет состоянием игры в зависимости от показа несовпавших объектов
   * При несовпадении выбранных объектов они переводятся в исходное состояние по таймеру.
   * До этого времени они оба "активны" (видны, слышны и т.д. - в зависимости от набора объектов), игра находится в состоянии GameStates.Showing и активировать другие объекты нельзя.
   * По мере перехода активированных объектов в исходное состояние - "не угадано", игра возвращается в состояние GameStates.InProgress и прочие объекты становятся доступны для активации.
   *
   * @private
   */
  toggleVisibleMismatchItemsCount = () => {
    appState.mismatchCount--;
    if (appState.mismatchCount === 0) {
      appState.gameState = GameStates.InProgress;
    }
  };

  /**
   * Переключает состояние доступности для элемента (например, кнопок в игре)
   *
   * @param {HTMLElement} element Элемент, доступность которого нужно переключить
   * @param {boolean} enabled Состояние элемента - выключен (true) или включен (false). Если не указано, то переключает текущее состояние на противоплоложное
   * @private
   */
  toggleElementDisabled = (element, disabled) => {
    if (typeof disabled === "undefined") {
      if (!element.getAttribute("disabled")) {
        element.setAttribute("disabled", "true");
      } else {
        element.removeAttribute("disabled");
      }
    } else {
      if (disabled) {
        element.setAttribute("disabled", `true`);
      } else {
        element.removeAttribute("disabled");
      }
    }
  };

  /**
   * Переводит указанные элемент в состояние "активирован"
   *
   * @private
   */
  setItemActivated = (itemId) => {
    let itemElement = this.itemsElement.querySelector(`#item-${itemId}`);
    itemElement.classList.remove("facedown");
    itemElement.classList.add("faceup");
    itemElement.style.backgroundColor = this.items.find(
      e => e.id === itemId
    ).color;
  };

  /**
   * Переводит указанные объекты в состояние "не угадано".
   *
   * @private
   */
  setItemsMismatch = (itemIds) => {
    appState.mismatchCount = 2;
    appState.gameState = GameStates.Showing;

    setTimeout(() => {
      this.items
        .filter(item => itemIds.includes(item.id))
        .map(item => item.id)
        .forEach(itemId => {
          const itemElement = this.itemsElement.querySelector(
            `#item-${itemId}`
          );
          itemElement.classList.remove("faceup");
          itemElement.style.backgroundColor = "";
          itemElement.classList.add("facedown");
          this.toggleVisibleMismatchItemsCount();
        });
    }, 800);
  };

  /**
   * Переводит указанные объекты в состояние "угадано".
   *
   * @private
   */
  setItemsMatch = (itemIds) => {
    this.items
      .filter(item => itemIds.includes(item.id))
      .map(item => item.id)
      .forEach(itemId => {
        let itemElement = this.itemsElement.querySelector(`#item-${itemId}`);
        itemElement.classList.remove("faceup");
        itemElement.classList.remove("facedown");
        itemElement.classList.add("match");
        itemElement.style.backgroundColor = this.items.find(
          e => e.id === itemId
        ).color;

        // добавляем id угаданного объекта в список угаданных
        appState.matchIds.push(itemId);
      });
  };
}
