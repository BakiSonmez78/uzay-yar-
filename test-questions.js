// Test advanced questions generation
const { generateAdvancedQuestions } = require('./server/advancedQuestions');

console.log('Testing Fractions Add:');
const fractionsQuestions = generateAdvancedQuestions('fractions_add');
console.log('Generated', fractionsQuestions.length, 'questions');
console.log('Sample question:', JSON.stringify(fractionsQuestions[0], null, 2));

console.log('\nTesting Percentages:');
const percentQuestions = generateAdvancedQuestions('percentages');
console.log('Generated', percentQuestions.length, 'questions');
console.log('Sample question:', JSON.stringify(percentQuestions[0], null, 2));

console.log('\nTesting Word Problems:');
const wordQuestions = generateAdvancedQuestions('word_problems');
console.log('Generated', wordQuestions.length, 'questions');
console.log('Sample question:', JSON.stringify(wordQuestions[0], null, 2));
