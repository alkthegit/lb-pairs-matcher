import Controller from './Controller.mjs';
import PairsMatcher from './PairsMatcher.mjs';

const initializeApp = async function initializeApp() {
    try {
        const containerDiv = document.querySelector('#app-matcher');

        const controller = new Controller(containerDiv, new PairsMatcher());

        // const pm = new PairsMatcher();
        // const itemsInfo = await pm.newGame(2);

        // const items = pm.getItems();
        // console.table(itemsInfo);

        // pm.on("gameOver", () => {
        //     console.log('Игра окончена!!!');
        // });
    }
    catch (err) {
        console.error(err);
    }
}

export default initializeApp; 