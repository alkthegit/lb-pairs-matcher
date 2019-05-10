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

const ColorCards8 = new class ColorCards8 {
}();

ColorCards8.getItems = function getItems() {
    return [...colorCards]
}

export default ColorCards8;