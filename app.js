const express = require('express');
const app = express();
const keys = require('./config/keys');
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
    consumer_key: keys.consumer_key,
    consumer_secret: keys.consumer_secret,
    access_token_key: keys.access_token_key,
    access_token_secret: keys.access_token_secret
});

app.post('/monitor', (req, res) => {
    const phrase = req.body.phrase;
    const seconds = req.body.seconds * 1;

    let tweetCount = 0;
    let pos = 0;
    let neg = 0;
    let nut = 0;

    tweeter.verifyCredentials(function (error, data) {
        if (error) {
            return "Error connecting to Twitter: " + error;
        } else {
            tweeter.stream('statuses/filter', {
                'track': phrase
            }, function (stream) {
                console.log("Monitoring Twitter for " + phrase);
                stream.on('data', function (data) {
                    // only evaluate the sentiment of English-language tweets
                    if (data.lang === 'en') {
                        sentiment.analyze(data.text, function (err, result) {
                            tweetCount++;
                            const score = result.score;
                            console.log(score);
                            if (score > 0) {
                                pos++;
                            } else if (score < 0) {
                                neg++;
                            } else {
                                nut++
                            }
                        });
                    }
                });
                stream.on('end', function () {
                    pos = Math.round((pos / tweetCount) * 100);
                    neg = Math.round((neg / tweetCount) * 100);
                    nut = Math.round((nut / tweetCount) * 100);
                    console.log({
                        tweetCount,
                        pos,
                        neg,
                        nut
                    })
                    res.send({
                        tweetCount,
                        pos,
                        neg,
                        nut
                    })
                });
                setTimeout(stream.destroy, seconds);
            });
        }
    });
});

app.get('/monitor', (req, res) => {
    const phrase = req.query.phrase;
    const seconds = req.query.seconds * 1000;
    res.render('chart', { phrase, seconds });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`App is listening to port ${PORT}`);
});