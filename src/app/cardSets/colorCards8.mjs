// массив из восьми цветом
const colors = [
    '#ff0000',
    '#ffff6e',
    '#00ff00',
    '#00ffff',
    '#0000ff',
    '#ff00ff',
    '#5c4508',
    '#808080'
];

const colorCards = [];

const ensureItems = function ensureItems() {
    if (colorCards.length !== 0) {
        return [...colorCards];
    };

    let newCard;
    let itemId = 0;
    let pairId = 0;
    colors.forEach((color) => {
        newCard = {
            id: itemId,
            pairId: pairId,
            color
        };
        colorCards.push(newCard);
        itemId++;

        newCard = {
            id: itemId,
            pairId: pairId,
            color
        };
        colorCards.push(newCard);
        itemId++

        pairId++;
    });
};

export default function getItems() {
    ensureItems();
    return [...colorCards];
}

const getItemsMap = function getItemsMap() {
    ensureItems();
    return colorCards.map((card) => {
        return {
            id: card.id,
            pairId: card.pairId
        };
    })
};

export { getItemsMap };