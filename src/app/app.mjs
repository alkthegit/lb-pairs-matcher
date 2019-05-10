import Controller from './Controller.mjs';

const initializeApp = function initializeApp() {
    const containerDiv = document.querySelector('#app-matcher');

    const controller = new Controller(containerDiv);
}

export default initializeApp; 