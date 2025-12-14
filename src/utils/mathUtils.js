export const generateQuestion = (mode) => {
    const ops = mode === 'mixed' ? ['+', '-', '*', '/'] : [mode];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1, num2, answer, displayOp;

    switch (op) {
        case '+':
            num1 = Math.floor(Math.random() * 50) + 1;
            num2 = Math.floor(Math.random() * 50) + 1;
            answer = num1 + num2;
            displayOp = '+';
            break;
        case '-':
            num1 = Math.floor(Math.random() * 50) + 10;
            num2 = Math.floor(Math.random() * num1);
            answer = num1 - num2;
            displayOp = '-';
            break;
        case '*':
            num1 = Math.floor(Math.random() * 12) + 1;
            num2 = Math.floor(Math.random() * 12) + 1;
            answer = num1 * num2;
            displayOp = '×';
            break;
        case '/':
            num2 = Math.floor(Math.random() * 10) + 2;
            answer = Math.floor(Math.random() * 12) + 1;
            num1 = num2 * answer;
            displayOp = '÷';
            break;
        default:
            break;
    }

    const options = new Set([answer]);
    while (options.size < 4) {
        const offset = Math.floor(Math.random() * 20) - 10;
        const wrong = answer + offset;
        if (wrong >= 0 && wrong !== answer) {
            options.add(wrong);
        }
    }

    return {
        num1,
        num2,
        op: displayOp,
        answer,
        options: Array.from(options).sort(() => Math.random() - 0.5)
    };
};
