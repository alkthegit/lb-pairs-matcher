import initializeApp from './app/app.mjs';

const initialize = function initialize() {
    console.log(`Application started`);
    initializeApp();
}

document.addEventListener('DOMContentLoaded', initialize);