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
     * @param {HTMLDivElement} containerDiv Элемент-контейнер для всего веб-приложения
     */
    constructor(containerDiv) {
        if (!containerDiv) {
            throw new Error(`Для контроллера необходимо указать контейнер приложения. Педано значение '${containerDiv}'`);
        }

        this.containerDiv = containerDiv;

        console.log(`Controller initialized`);
    }
}