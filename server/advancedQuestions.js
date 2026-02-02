// Advanced Math Question Generator for Elementary School
// Includes fractions, percentages, geometry, word problems, and more

// Helper: GCD (Greatest Common Divisor) for fraction simplification
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);

// Helper: Simplify fraction
const simplifyFraction = (num, den) => {
    const divisor = gcd(num, den);
    return { num: num / divisor, den: den / divisor };
};

// Helper: Format fraction as string
const formatFraction = (num, den) => {
    if (den === 1) return num.toString();
    return `${num}/${den}`;
};

const generateAdvancedQuestions = (category) => {
    const questions = [];

    for (let i = 0; i < 50; i++) {
        let question, answer, options, displayText;

        switch (category) {
            case 'fractions_add': {
                // Addition of fractions with same denominator
                const den = [2, 3, 4, 5, 6, 8, 10][Math.floor(Math.random() * 7)];
                const num1 = Math.floor(Math.random() * (den - 1)) + 1;
                const num2 = Math.floor(Math.random() * (den - 1)) + 1;
                const resultNum = num1 + num2;

                // Simplify result
                const simplified = simplifyFraction(resultNum, den);
                answer = parseFloat((simplified.num / simplified.den).toFixed(4));

                displayText = `${formatFraction(num1, den)} + ${formatFraction(num2, den)} = ?`;

                // Generate wrong options
                const wrongOptions = [
                    parseFloat(((num1 + num2) / (den * 2)).toFixed(4)), // Common mistake: add denominators
                    parseFloat((num1 / den + num2 / (den + 1)).toFixed(4)), // Wrong denominator
                    parseFloat(((resultNum + 1) / den).toFixed(4)), // Off by one in numerator
                ];

                options = new Set([answer, ...wrongOptions.filter(o => o !== answer)]);
                while (options.size < 4) {
                    options.add(parseFloat((Math.random() * 2).toFixed(4)));
                }

                question = {
                    id: i,
                    text: displayText,
                    answer: answer.toFixed(2),
                    options: Array.from(options).sort(() => Math.random() - 0.5).map(o => o.toFixed(2))
                };
                break;
            }

            case 'fractions_compare': {
                // Compare two fractions
                const den1 = [2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 6)];
                const den2 = [2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 6)];
                const num1 = Math.floor(Math.random() * den1) + 1;
                const num2 = Math.floor(Math.random() * den2) + 1;

                const val1 = num1 / den1;
                const val2 = num2 / den2;

                let symbol;
                if (val1 > val2) symbol = '>';
                else if (val1 < val2) symbol = '<';
                else symbol = '=';

                displayText = `${formatFraction(num1, den1)} ___ ${formatFraction(num2, den2)}`;
                answer = symbol;

                // Always 4 options for consistency
                options = new Set(['>', '<', '=', '≠']);

                question = {
                    id: i,
                    text: displayText,
                    answer: answer,
                    options: Array.from(options).sort(() => Math.random() - 0.5)
                };
                break;
            }

            case 'percentages': {
                // Simple percentage calculations
                const base = [10, 20, 25, 50, 100, 200][Math.floor(Math.random() * 6)];
                const percent = [10, 20, 25, 50, 75][Math.floor(Math.random() * 5)];

                answer = (base * percent) / 100;
                displayText = `${base}'nin %${percent}'si = ?`;

                options = new Set([
                    answer,
                    answer + 5,
                    answer - 5,
                    answer * 2,
                    Math.floor(answer / 2)
                ]);

                while (options.size < 4) {
                    options.add(Math.floor(Math.random() * base));
                }

                question = {
                    id: i,
                    text: displayText,
                    answer: String(answer),
                    options: Array.from(options).filter(o => o > 0).slice(0, 4).sort(() => Math.random() - 0.5).map(String)
                };
                break;
            }

            case 'area_rectangle': {
                // Area of rectangle with difficulty levels
                let width, height, shape;

                // Difficulty affects size and complexity
                if (Math.random() < 0.3) { // 30% chance for square
                    const side = Math.floor(Math.random() * 12) + 3;
                    width = side;
                    height = side;
                    shape = 'kare';
                } else {
                    // Rectangle with varying difficulty
                    const minSize = 2;
                    const maxSize = 15;
                    width = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
                    height = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
                    shape = 'dikdörtgen';
                }

                answer = width * height;
                displayText = width === height
                    ? `${width}cm kenar uzunluğundaki karenin alanı? (cm²)`
                    : `${width}cm × ${height}cm dikdörtgenin alanı? (cm²)`;

                options = new Set([
                    answer,
                    width + height, // Perimeter mistake
                    2 * (width + height), // Double perimeter mistake
                    width * height + width,
                    width * height - height,
                    Math.floor(width * height / 2) // Half area
                ]);

                while (options.size < 4) {
                    options.add(Math.floor(Math.random() * 150) + 1);
                }

                question = {
                    id: i,
                    text: displayText,
                    answer: String(answer),
                    options: Array.from(options).slice(0, 4).sort(() => Math.random() - 0.5).map(String)
                };
                break;
            }

            case 'perimeter': {
                // Perimeter with difficulty levels
                let width, height, shape;

                // Difficulty affects size and complexity
                if (Math.random() < 0.3) { // 30% chance for square
                    const side = Math.floor(Math.random() * 12) + 3;
                    width = side;
                    height = side;
                    shape = 'kare';
                } else if (Math.random() < 0.5) { // 50% chance for triangle
                    // Equilateral triangle
                    const side = Math.floor(Math.random() * 15) + 5;
                    answer = 3 * side;
                    displayText = `${side}cm kenar uzunluğundaki eşkenar üçgenin çevresi? (cm)`;

                    options = new Set([
                        answer,
                        side * 2, // Two sides only
                        side * 4, // Four sides
                        Math.floor(side * 2.5),
                        side + 10
                    ]);

                    while (options.size < 4) {
                        options.add(Math.floor(Math.random() * 60) + 1);
                    }

                    question = {
                        id: i,
                        text: displayText,
                        answer: String(answer),
                        options: Array.from(options).sort(() => Math.random() - 0.5).map(String)
                    };
                    break;
                } else {
                    // Rectangle
                    const minSize = 2;
                    const maxSize = 15;
                    width = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
                    height = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
                }

                answer = width === height ? 4 * width : 2 * (width + height);
                displayText = width === height
                    ? `${width}cm kenar uzunluğundaki karenin çevresi? (cm)`
                    : `${width}cm × ${height}cm dikdörtgenin çevresi? (cm)`;

                options = new Set([
                    answer,
                    width * height, // Area mistake
                    width + height, // Only two sides
                    2 * width + height, // Missing one side
                    width * 4, // Only one dimension
                    height * 4
                ]);

                while (options.size < 4) {
                    options.add(Math.floor(Math.random() * 80) + 1);
                }

                question = {
                    id: i,
                    text: displayText,
                    answer: String(answer),
                    options: Array.from(options).slice(0, 4).sort(() => Math.random() - 0.5).map(String)
                };
                break;
            }

            case 'word_problems': {
                // Simple word problems
                const templates = [
                    {
                        text: (a, b) => `Ali'nin ${a} kalemi var. ${b} kalem daha alırsa kaç kalemi olur?`,
                        answer: (a, b) => a + b
                    },
                    {
                        text: (a, b) => `Bir sepette ${a} elma var. ${b} tanesini yedik. Kaç elma kaldı?`,
                        answer: (a, b) => a - b
                    },
                    {
                        text: (a, b) => `${a} öğrenci var. Her öğrenciye ${b} defter verilecek. Kaç defter gerekir?`,
                        answer: (a, b) => a * b
                    },
                    {
                        text: (a, b) => `${a * b} çikolata ${a} çocuğa eşit paylaştırılacak. Her çocuk kaç çikolata alır?`,
                        answer: (a, b) => b
                    }
                ];

                const template = templates[Math.floor(Math.random() * templates.length)];
                const num1 = Math.floor(Math.random() * 20) + 5;
                const num2 = Math.floor(Math.random() * 10) + 2;

                displayText = template.text(num1, num2);
                answer = template.answer(num1, num2);

                options = new Set([
                    answer,
                    answer + 1,
                    answer - 1,
                    answer + num2,
                    Math.floor(answer / 2)
                ]);

                while (options.size < 4) {
                    options.add(Math.floor(Math.random() * 50) + 1);
                }

                question = {
                    id: i,
                    text: displayText,
                    answer: String(answer),
                    options: Array.from(options).filter(o => o > 0).slice(0, 4).sort(() => Math.random() - 0.5).map(String)
                };
                break;
            }

            case 'time': {
                // Time calculations
                const hour1 = Math.floor(Math.random() * 12) + 1;
                const min1 = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
                const addHours = Math.floor(Math.random() * 3) + 1;
                const addMins = [0, 15, 30, 45][Math.floor(Math.random() * 4)];

                let resultHour = hour1 + addHours;
                let resultMin = min1 + addMins;

                if (resultMin >= 60) {
                    resultHour += 1;
                    resultMin -= 60;
                }

                if (resultHour > 12) resultHour -= 12;

                displayText = `Saat ${hour1}:${min1.toString().padStart(2, '0')}. ${addHours} saat ${addMins} dakika sonra saat kaç olur?`;
                answer = `${resultHour}:${resultMin.toString().padStart(2, '0')}`;

                // Generate wrong time options
                const wrongOptions = [
                    `${(resultHour + 1) % 12 || 12}:${resultMin.toString().padStart(2, '0')}`,
                    `${resultHour}:${((resultMin + 15) % 60).toString().padStart(2, '0')}`,
                    `${(resultHour - 1) || 12}:${resultMin.toString().padStart(2, '0')}`
                ];

                options = new Set([answer, ...wrongOptions]);

                question = {
                    id: i,
                    text: displayText,
                    answer: answer,
                    options: Array.from(options).slice(0, 4).sort(() => Math.random() - 0.5)
                };
                break;
            }

            case 'patterns': {
                // Number patterns with varying difficulty
                const patternType = Math.floor(Math.random() * 5);

                switch (patternType) {
                    case 0: {
                        // Simple arithmetic sequence (easy)
                        const start = Math.floor(Math.random() * 10) + 1;
                        const step = [2, 3, 5, 10][Math.floor(Math.random() * 4)];
                        const sequence = [start, start + step, start + 2 * step, start + 3 * step];

                        answer = start + 4 * step;
                        displayText = `${sequence.join(', ')}, ?`;

                        options = new Set([
                            answer,
                            answer + step,
                            answer - step,
                            answer + 1,
                            start + 5 * step
                        ]);
                        break;
                    }
                    case 1: {
                        // Decreasing sequence (medium)
                        const start = Math.floor(Math.random() * 30) + 20;
                        const step = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
                        const sequence = [start, start - step, start - 2 * step, start - 3 * step];

                        answer = start - 4 * step;
                        displayText = `${sequence.join(', ')}, ?`;

                        options = new Set([
                            answer,
                            answer - step,
                            answer + step,
                            start - 5 * step,
                            Math.floor(answer / 2)
                        ]);
                        break;
                    }
                    case 2: {
                        // Multiplication pattern (medium-hard)
                        const start = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
                        const multiplier = 2;
                        const sequence = [start, start * multiplier, start * multiplier * multiplier, start * multiplier * multiplier * multiplier];

                        answer = start * Math.pow(multiplier, 4);
                        displayText = `${sequence.join(', ')}, ?`;

                        options = new Set([
                            answer,
                            answer * 2,
                            answer / 2,
                            sequence[3] + start,
                            sequence[3] * 3
                        ]);
                        break;
                    }
                    case 3: {
                        // Alternating add/subtract (hard)
                        const start = Math.floor(Math.random() * 10) + 5;
                        const add = [3, 5, 7][Math.floor(Math.random() * 3)];
                        const subtract = [2, 4][Math.floor(Math.random() * 2)];
                        const sequence = [
                            start,
                            start + add,
                            start + add - subtract,
                            start + add - subtract + add
                        ];

                        answer = start + add - subtract + add - subtract;
                        displayText = `${sequence.join(', ')}, ?`;

                        options = new Set([
                            answer,
                            answer + add,
                            answer - subtract,
                            sequence[3] + add,
                            sequence[3] - subtract
                        ]);
                        break;
                    }
                    case 4: {
                        // Fibonacci-like (hard)
                        const a = Math.floor(Math.random() * 5) + 1;
                        const b = Math.floor(Math.random() * 5) + 1;
                        const sequence = [a, b, a + b, a + 2 * b];

                        answer = 2 * a + 3 * b;
                        displayText = `${sequence.join(', ')}, ?`;

                        options = new Set([
                            answer,
                            sequence[3] + a,
                            sequence[3] + b,
                            sequence[3] * 2,
                            a + 3 * b
                        ]);
                        break;
                    }
                }

                while (options.size < 4) {
                    options.add(Math.floor(Math.random() * 100) + 1);
                }

                question = {
                    id: i,
                    text: displayText,
                    answer: String(answer),
                    options: Array.from(options).filter(o => o > 0).slice(0, 4).sort(() => Math.random() - 0.5).map(String)
                };
                break;
            }

            default: {
                // Fallback to basic addition
                const num1 = Math.floor(Math.random() * 50) + 1;
                const num2 = Math.floor(Math.random() * 50) + 1;
                answer = num1 + num2;

                question = {
                    id: i,
                    num1,
                    num2,
                    op: '+',
                    answer,
                    options: [answer, answer + 1, answer - 1, answer + 2].sort(() => Math.random() - 0.5)
                };
            }
        }

        questions.push(question);
    }

    return questions;
};

module.exports = { generateAdvancedQuestions };
