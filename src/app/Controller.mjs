import PairsMatcher from "./PairsMatcher.mjs";

export default class Controller {
    /**
     * Элемет-контейнер для всего веб-приложения. Задается единовременно при создании экземпляра класса
     * 
     * @type {HTMLDivElement}
     * @private
     */
    containerDiv;


    /**
     * 
     * @type {PairsMatcher} 
     */
    pairsMatcher;

    /**
     * 
     * @param {HTMLDivElement} containerDiv Элемент-контейнер для всего веб-приложения
     */
    constructor(containerDiv) {
        if (!containerDiv) {
            throw new Error(`Для контроллера необходимо указать контейнер приложения. Педано значение '${containerDiv}'`);
        }

        if (!pairsMatcher) {
            throw new Error(`Для контроллера необходимо указать экземпляр управляющего класс для игры. Педано значение '${pairsMatcher}'`);
        }

        this.containerDiv = containerDiv;
        this.pairsMatcher = pairsMatcher;

        generateGameField();
        console.log(`Controller initialized`);
    }

    /**
     * Порождает новое игровое поле в контейнере приложения
     */
    generateGameField() {
        const fieldHTML = `
            <div class="gameboard">
                <div class="items">
                    .
                </div>
            </div>
        `;
    }
}



