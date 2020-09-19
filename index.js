/*
 * Execute
 */

window.onload = () => {
    reset();
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
    labels = [];
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
                (!row || !col)
                    ? this.createLabel(row, col)
                    : this.createCell(row, col);
                col++;
            }
            // drop line
            this.el.appendChild(document.createElement('br'));
            row++;
        }
    }

    createLabel(row, col) {
        const label = new Label(this, row, col, getLabelValue(row, col));
        this.labels.push(label);
    }

    createCell(row, col) {
        const cell = new Cell(this, row, col);
        cell.setKey(this.labels.find(l => l.col === col).el.value);
        this.cells.push(cell);
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
        this.el.value = value;
        this.el.classList.add('has-text-centered');
    }
}

/* 
 * Methods
 */

const reset = () => {
    new Sheet();
}

const getLabelValue = (row, col) => {
    return (row === 0) 
        // col labels require alphabet logic
        ? getColLabelValue(col)
        // row labels are simply the row number
        : row.toString().toUpperCase();
};

const getColLabelValue = (col) => {
    // top left square is empty
    if (col === 0) return null;

    let value = '';

    // -1 to account for col labels
    const adjustedCol = col - 1;
    const alphabetIndex = toAlphabetIndex(adjustedCol);
    
    // "A" or "AA"
    const requiresPad = adjustedCol > alphabet.length - 1;
    if (requiresPad) {
        // todo: extend logic to handle "AAA" / "AAAA" etc.
        const padding = Math.max(0, Math.floor(col / alphabet.length - 1));
        value += alphabet[padding];
    }

    value += alphabet[alphabetIndex];
    return value.toUpperCase();
}

const toAlphabetIndex = (col) => {
    const max = alphabet.length - 1;
    if (col <= max) return col;
    else return toAlphabetIndex(col - alphabet.length);
}