/*
 * Execute
 */
window.onload = () => {
    createSheet();
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

        this.el = document.createElement('div');
        this.el.setAttribute('id', 'sheet');
        
        this.createCells();
        
        const appContainer = document.getElementById('app');
        appContainer.appendChild(this.el);
    }

    createCells() {
        // Loop through rows
        let row = 0; 
        while(row <= this.rowCount) {
            // Create cols
            let col = 0;
            while(col <= this.colCount) {
                !row || !col
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
        cell.setKey(this.labels.find(l => l.col === col).el.value.toUpperCase());
        this.cells.push(cell);
    }

    remove() {
        this.el.parentElement.removeChild(this.el);
    }

    populate(cells) {
        const dataCells = cells.filter(c => c.value || c.formula);
        dataCells.forEach(cell => {
            const myCell = this.cells.find(c => c.key === cell.key);
            if (myCell) {
                myCell.saveValue(cell.value);
                myCell.saveFormula(cell.formula);
            }
        });
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
        input[0] === '='
            // requires operation
            ? this.doOp(input)
            // is a simple number
            : this.saveValue(input);
    }

    doOp(input) {
        this.saveFormula(input);

        let chars = input.split('');
        chars.splice(0, 1); // remove '='

        const result = isNaN(input[1])
            ? this.complexOp(chars)
            : this.basicOp(chars);

        this.saveValue(result);
    }

    basicOp(chars) {
        let total = 0;
        while(chars.length) {
            const opIndex = chars.findIndex(c => operators.includes(c));
            const operandOne = Number(chars.splice(0, opIndex).join(''));
            const operator = chars.splice(0, 1)[0];
            const nextOpIndex = chars.findIndex(c => operators.includes(c));
            const operandTwo = nextOpIndex === -1 
                // only one operation requested
                ? Number(chars.splice(0, chars.length).join(''))
                // multiple requested
                : Number(chars.splice(0, nextOpIndex).join(''));
            
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
            if (chars.length) chars.unshift(...total.toString().split(''));
        }

        return total.toString();
    }

    complexOp(chars) {
        let total = 0;
        const opEnd = chars.findIndex(c => c === '(');
        const op = chars.splice(0, opEnd).join('').toUpperCase();
        chars.splice(0, 1); // trim opening bracket
        chars.splice(chars.length - 1, 1); // trim closing bracket

        switch (op) {
            case 'SUM':
                chars = chars.join('').toUpperCase();
                const operandOne = chars.split(':')[0]; // A12
                const operandTwo = chars.split(':')[1]; // A18
                const sorted = [operandOne, operandTwo].sort((a, b) => b - a);
                const low = sorted[0];
                const high = sorted[1];

                const targetCells = this.sheet.cells.filter(c => {
                    // add length check due to string kerfuffles
                    return c.key >= low && c.key <= high && c.key.length <= high.length;
                });

                total = targetCells.reduce((a, c) => {
                    return a + Number(c.value);
                }, 0);
                break;
            // add more ops here like AVERAGE, COUNT, MAX etc.
            default:
                throw new Error;
        }

        // next add event listeners
        return total.toString();
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
const refresh = (sheet) => {
    sheet.remove();
    createSheet(sheet.cells);
}

const createSheet = (data) => {
    const sheet = new Sheet();
    if (data) sheet.populate(data);
    const refresh = document.getElementById('refresh');
    refresh.onclick = () => refresh(sheet);
    refresh.classList.remove('invisible');
}

const getLabelValue = (row, col) => {
    return row === 0
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

const toAlphabetIndex = (index) => {
    const max = alphabet.length - 1;
    if (index <= max) return index;
    else return toAlphabetIndex(index - alphabet.length);
}