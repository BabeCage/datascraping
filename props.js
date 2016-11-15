var Nightmare = require('nightmare');
var fs = require('fs');
var http = require('http');
var nightmare = Nightmare();
var url = 'https://sports.bovada.lv/basketball/nba/player-props-market-group';

nightmare
.goto(url)
.wait(3000)
.then(scrollToTheBottom.bind(void 0, 0, 0));

function scrollToTheBottom(totalProps, len) {
    console.log("totalProps: " + totalProps);
    console.log("visibleProps: " + len);

    nightmare.evaluate(function () {
        return document.body.scrollHeight;
    }).then(function (height) {
        console.log("documentHeight: "+ height);
        nightmare.scrollTo(height, 0)
        .wait(3000)
        .evaluate(theMagic)
        .then(function (result) {
            if (typeof result === "object") {
                savePropsToCSV(result);
                process.exit();
            } else if (typeof result === "number") {
                scrollToTheBottom(totalProps, result);
            }
        })
        .catch(function (error) {
            console.log(error);
            process.exit();
        });
    });
}


function theMagic() {
    var articles = document.querySelectorAll('.infinite-scroll article');
    var totalProps = parseInt(document.querySelector('h2').innerText.split(' ')[0], 10);

    if (articles.length >= totalProps) {
        return processData(articles);
    } else {
        return articles.length;
    }

    function processData(articles) {
        var props = [];
        Array.prototype.forEach.call(articles, function (article) {
            var playerStat = article.querySelector('section h4').innerText;
            var overUnder = article.querySelectorAll('section > ul > li > button');
            var stat = parsePlayerStat(playerStat);

            extend(stat, parseOverUnder(overUnder));
            props.push(stat);
        });
        return props;
    }

    function parsePlayerStat(playerStat) {
        var values = [
            playerStat.substring(0, playerStat.indexOf('-')),
            playerStat.substring(playerStat.indexOf('-') + 1)
        ];
        var stat = values[0].trim().replace(',',':');
        var playerTeam = values[1].split(' ');
        var team = playerTeam.pop();
        var player = playerTeam.join(' ').trim();
        return {
            player: player,
            stat: stat,
            team: team
        };
    }

    function parseOverUnder(overUnder) {
        var over = overUnder[0].querySelectorAll('span')[1].innerText.split(' ');
        var value = over[0];
        var under = overUnder[1].querySelectorAll('span')[1].innerText.split(' ')[1];
        return {
            value: value,
            over: over[1],
            under: under
        };
    }

    //bootleg version of lodash extend
    function extend (objA, objB) {
        for(var key in objB) {
            objA[key] = objB[key];
        }
    }
}

function savePropsToCSV(props) {
    var rows = props.map(propToCSVString);
    fs.writeFileSync(getFileName(), rows.join('\n'));
}

function propToCSVString(stat) {
    var cols = [
        'player',
        'team',
        'stat',
        'value',
        'over',
        'under'
    ];
    var vals = [];
    cols.forEach(function (col) {
        vals.push(stat[col]);
    });
    return vals.join(',');
}

function getFileName() {
    var today = new Date();
    var str = (today.getMonth() + 1) + "-" + today.getDate() + "-" + today.getFullYear();
    return './downloads/' + str + '.csv';
}
