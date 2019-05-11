import Controller from './Controller.mjs';
import PairsMatcher from './PairsMatcher.mjs';
import getItems from './cardSets/colorCards8.mjs';

const initializeApp = function initializeApp() {
    const containerDiv = document.querySelector('#app-matcher');

    const controller = new Controller(containerDiv, new PairsMatcher());
}

export default initializeApp; 