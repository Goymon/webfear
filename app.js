const express = require('express');
const app = express();
const twitter = require('ntwitter');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

app.get('/', (req, res) => {
    res.render('index');
});

var tweeter = new twitter({
    consumer_key: 'wvUQK0MP33BxiqexLGny6u9tI',
    consumer_secret: 'RMeHtbrIWRVS1AX9XWMDFb4kHn2Z8SimlsrxNwc4p4SDTb6geZ',
    access_token_key: '895866685638402048-nFolZxqq6Mmph6P2A82PaUNt5CHyInB',
    access_token_secret: 'xASy4CgmQ8uEei5oeXsfwz3uvIbBlscDUmQOLSZvAWXYt'
});

async function beginMonitoring(phrase) {
    const monitoringPhrase = phrase;
    let tweetCount = 0;
    let pos = 0;
    let neg = 0;
    let nut = 0;
    await tweeter.verifyCredentials(function (error, data) {
        if (error) {
            return "Error connecting to Twitter: " + error;
        } else {
            tweeter.stream('statuses/filter', {'track': monitoringPhrase}, async function (stream) {
                console.log("Monitoring Twitter for " + monitoringPhrase);
                await stream.on('data', function (data) {
                    // only evaluate the sentiment of English-language tweets
                    if (data.lang === 'en') {
                        sentiment.analyze(data.text, function (err, result) {
                            tweetCount++;
                            const score = result.score;
                            console.log(score);
                            if(score > 0) {
                                pos++;
                            } else if(score < 0) {
                                neg++;
                            } else {
                                nut++
                            }
                        });
                    }
                    setTimeout(stream.destroy, 5000);
                });
            });
        }
    });
    return {
        tweetCount,
        pos,
        neg,
        nut
    };
}

app.get('/monitor', async (req, res) => {
    const phrase = req.query.phrase;
    res.send(await beginMonitoring(phrase));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`App is listening to port ${PORT}`);
});