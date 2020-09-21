/* 
 * Globals
 */
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const operators = '+-*/'.split('');

/*
 * Execute
 */
window.onload = () => {
    createSheet();
}

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

    populate(data) {
        data.filter(c => c.value || c.formula || c.watchers.length || c.isWatching)
            .forEach(c => {
                const myCell = this.cells.find(c => c.key === c.key);
                if (myCell) {
                    myCell.saveValue(c.value);
                    myCell.saveFormula(c.formula);
                    myCell.watchers = c.watchers;
                    myCell.isWatching = c.isWatching;
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
    watchers = [];
    isWatching;

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
                this.calculateValue(input);
            }
        }
    }

    calculateValue(input) {
        try {
            input[0] === '='
                ? this.doOp(input) // Requires operation
                : this.save(input, input);
        } catch (error) {
            // Set #N/A
            console.log(error)
            this.save(this.input, '#N/A');
        }
    }

    doOp(input) {
        const result = isNaN(input[1])
            ? this.complexOp(input)
            : this.basicOp(input);
        this.save(input, result);
    }

    save(input, result) {
        this.clearStaleWatchers(input);
        this.saveFormula(input);
        this.saveValue(result);
        this.runWatchers();
    }

    basicOp(input) {
        let total = 0;
        let chars = input.split('');
        chars.splice(0, 1); // Remove '='
        while(chars.length) {
            const opIndex = chars.findIndex(c => operators.includes(c));
            const operandOne = Number(chars.splice(0, opIndex).join(''));
            const operator = chars.splice(0, 1)[0];
            const nextOpIndex = chars.findIndex(c => operators.includes(c));
            const operandTwo = nextOpIndex === -1 
                // Only one operation requested
                ? Number(chars.splice(0, chars.length).join(''))
                // Multiple requested
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

    complexOp(input) {
        let targetCells = [];

        let chars = input.split('');
        chars.splice(0, 1); // Remove '='

        let total = 0;
        const opEnd = chars.findIndex(c => c === '(');
        const op = chars.splice(0, opEnd).join('').toUpperCase();
        chars.splice(0, 1); // Trim opening bracket
        chars.splice(chars.length - 1, 1); // Trim closing bracket

        switch (op) {
            case 'SUM':
                chars = chars.join('').toUpperCase();
                const operandOne = chars.split(':')[0];
                const operandTwo = chars.split(':')[1];
                const sorted = [operandOne, operandTwo].sort((a, b) => b - a);
                const low = sorted[0];
                const high = sorted[1];

                targetCells = this.sheet.cells.filter(c => {
                    return (c.key >= low && 
                            c.key <= high && 
                            // Add length check due to string kerfuffles
                            c.key.length <= high.length);
                });

                total = targetCells.reduce((a, c) => a + Number(c.value), 0);
                break;
            default:
                throw new Error;
        }

        // Add watcher functions to target cells
        if (input !== this.formula && targetCells.length) this.addWatchers(targetCells, input);

        return total.toString();
    }

    saveValue(input) {
        this.value = input.toString();
        this.el.value = this.value;
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

    addWatchers(targetCells, input) {
        targetCells.forEach(c => {
            c.watchers.push({
                key: this.key,
                func: () => this.calculateValue(input)
            });
        });
        this.isWatching = true;
    }

    runWatchers() {
        this.watchers.forEach(w => {
            w.func();
        });
    }

    clearStaleWatchers(input) {
        const hasChangedFormula = this.formula && input !== this.formula;
        if (this.isWatching && hasChangedFormula) {
            this.sheet.cells
                .filter(c => c.watchers.find(w => w.key === this.key))
                .forEach(c => c.watchers = c.watchers.filter(w => w.key !== this.key));

            this.isWatching = false;
        }
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