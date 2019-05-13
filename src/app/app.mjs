import Controller from './Controller.mjs';
import PairsMatcher from './PairsMatcher.mjs';

const initializeApp = function initializeApp() {
  const containerDiv = document.querySelector('#app-matcher');
  const pairsMatcher = new PairsMatcher();
  const controller = new Controller(containerDiv, pairsMatcher);
  controller.initialize();
};

export default initializeApp;
