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
const operators = '+-*/'.split('');

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
        // Loop through rows
        let row = 0; 
        while(row <= this.rowCount) {
            // Create cols
            let col = 0;
            while(col <= this.colCount) {
                (!row || !col)
                    ? this.createLabel(row, col)
                    : this.createCell(row, col);
                col++;
            }
            // Drop a line
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
    value = '';
    formula;

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
        this.addEvents();
    }

    addEvents() {
        this.el.onfocus = () => {
            if (this.formula) this.showFormula();
        }

        this.el.onblur = (e) => {
            const input = e.target.value;
            if (input) {
                try {
                    this.calculateValue(input);
                } catch (error) {
                    // set #N/A
                    console.log(error);
                    this.saveValue('#N/A');
                    this.saveFormula(input);
                }
            }
        }
    }

    calculateValue(input) {
        (input[0] === '=')
            // requires operation
            ? (isNaN(input[1]))
                ? this.complexOp(input)
                : this.basicOp(input)
            // is a simple number
            : this.saveValue(input);
    }

    basicOp(input) {
        console.log('basic');
        this.saveFormula(input);
        let total = 0;
        let tempChars = input.split('');
        tempChars.splice(0, 1); // remove '=';

        while(tempChars.length) {
            const opIndex = tempChars.findIndex(c => operators.includes(c));
            const operandOne = Number(tempChars.splice(0, opIndex).join(''));
            const operator = tempChars.splice(0, 1)[0];
            const nextOpIndex = tempChars.findIndex(c => operators.includes(c));
            const operandTwo = nextOpIndex === -1 
                // only one operation requested
                ? Number(tempChars.splice(0, tempChars.length).join(''))
                // multiple requested
                : Number(tempChars.splice(0, nextOpIndex).join(''));
            
            switch (operator) {
                case '+':
                    total = operandOne + operandTwo;
                    break;
                case '-':
                    total = operandOne - operandTwo;
                    break;
                case '*':
                    total = operandOne * operandTwo;
                    break;
                case '/':
                    total = operandOne / operandTwo;
                    break;
                default:
                    throw new Error;
            }

            if (tempChars.length) tempChars.unshift(...total.toString().split(''));
        }

        this.saveValue(total.toString());
    }

    complexOp(input) {
        console.log('complex')
    }

    saveValue(input) {
        this.value = input;
        this.el.value = this.value
    }

    saveFormula(input) {
        this.formula = input;
    }

    showFormula() {
        this.el.value = this.formula;
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
        // Col labels require alphabet logic
        ? getColLabelValue(col)
        // Row labels are simply the row number
        : row.toString().toUpperCase();
};

const getColLabelValue = (col) => {
    // Top left square is empty
    if (col === 0) return null;

    let value = '';

    // -1 to account for col labels
    const adjustedCol = col - 1;
    const alphabetIndex = toAlphabetIndex(adjustedCol);
    
    // "A" or "AA". Note: need to extend logic to handle "AAA" / "AAAA" etc.
    const requiresPad = adjustedCol > alphabet.length - 1;
    if (requiresPad) value += alphabet[Math.max(0, Math.floor(col / alphabet.length - 1))];

    value += alphabet[alphabetIndex];
    return value.toUpperCase();
}

const toAlphabetIndex = (col) => {
    const max = alphabet.length - 1;
    if (col <= max) return col;
    else return toAlphabetIndex(col - alphabet.length);
}