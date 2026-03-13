const https = require('https');
const fs = require('fs');

function decodeHTML(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&hellip;/g, '...')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–');
}

https.get('https://opentdb.com/api.php?amount=37&type=multiple', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.response_code !== 0) {
            console.error('OpenTDB error, response code:', parsed.response_code);
            return;
        }
        const questions = parsed.results.map(q => ({
            question: decodeHTML(q.question),
            answer: decodeHTML(q.correct_answer),
            option1: decodeHTML(q.incorrect_answers[0]),
            option2: decodeHTML(q.incorrect_answers[1]),
            option3: decodeHTML(q.incorrect_answers[2]),
            imgsrc: "none",
            difficulty: q.difficulty,
            subject: q.category
        }));
        fs.writeFileSync('questions.json', JSON.stringify(questions, null, 2));
        console.log(`Saved ${questions.length} questions to questions.json`);
    });
}).on('error', err => console.error('Request failed:', err.message));
