/*
 * Execute
 */

window.onload = () => {
    initSheet();
}

/* 
 * Globals
 */
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

/* 
 * Classes
 */

class Sheet {
    el;
    rowLabels = [];
    cells = [];
    colCount;
    rowCount;

    constructor(rowCount = 100, colCount = 100) {
        this.rowCount = rowCount;
        this.colCount = colCount;

        this.createEl();
        this.createCells();
    }

    createEl() {
        this.el = document.createElement('div');
        this.el.setAttribute('id', 'sheet');
        var old = document.getElementById('sheet');
        if (old) old.parentElement.removeChild(old);
        document.getElementById('app').appendChild(this.el);
    }

    createCells() {
        // loop through rows
        let row = 0; 
        while(row <= this.rowCount) {
            // create cols
            let col = 0;
            while(col <= this.colCount) {
                if (row === 0) {
                    // create row labels
                    const label = new Label(this, row, col, getLabel(row, col));
                    this.rowLabels.push(label);
                } else {
                    if (col === 0) {
                        // create col label
                        const label = new Label(this, row, col, getLabel(row, col));
                    } else {
                        // create cell
                        const cell = new Cell(this, row, col);
                        cell.setKey(this.rowLabels.find(l => l.col === col).el.value);
                    }
                }
                col++;
            }

            // drop line
            this.el.appendChild(document.createElement('br'));
            row++;
        }
    }
}

class Cell {
    el;
    sheet;
    row;
    col;
    key;

    constructor(sheet, row, col) {
        this.sheet = sheet;
        this.row = row;
        this.col = col;
        this.createEl();
    }

    createEl() {
        this.el = document.createElement('input');
        this.el.type = 'text';
        this.sheet.el.appendChild(this.el);
    }

    setKey(rowKey) {
        this.key = rowKey + this.row.toString();
    }
}

class Label extends Cell {
    constructor(sheet, row, col, value) {
        super(sheet, row, col);
        this.el.disabled = true;
        this.el.value = value ? value.toUpperCase() : null;
        this.el.classList.add('has-text-centered');
    }
}

/* 
 * Methods
 */

const initSheet = () => {
    const sheet = new Sheet();
}

const getLabel = (row, col) => {
    let label = '';
    // is a row label
    if (row === 0) {
        // top left square is empty
        if (col === 0) return null;

        // -1 to account for col labels
        const adjustedCol = col - 1;
        
        const maxAlphabetIndex = alphabet.length - 1
        const alphabetIndex = toAlphabetIndex(adjustedCol);
        const requiresPad = adjustedCol > maxAlphabetIndex;

        if (requiresPad) {
            const padding = Math.max(0, Math.floor(adjustedCol / maxAlphabetIndex));
            label += alphabet[padding];
        }

        label += alphabet[alphabetIndex];

    } else {
        // is a col label
        label = row.toString();
    }

    return label;
};

const toAlphabetIndex = (col) => {
    const max = alphabet.length - 1;
    if (col <= max) return col;
    else return toAlphabetIndex(col - alphabet.length);
}