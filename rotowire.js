var Nightmare = require('nightmare');
var fs = require('fs');
var http = require('http');

var nightmare = new Nightmare()
    .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
    .goto('http://www.rotowire.com/basketball/nba_lineups.htm')
    .wait()
    .evaluate(function () {
        var title = document.querySelector('h1.titletext-smallest').innerText;
        var positions = document.querySelectorAll('.dlineups-pos');

        return Array.prototype.map.call(positions, function (elem) {
            return elem.parentNode.querySelector('div a').innerHTML;
        });
    })
    .then(function (starters) {
        return fs.writeFile(getFileName(), starters.join('\n'), function (error) {
            if (error) {
                console.log(error);
            }
            console.log('file was saved!');
            process.exit();
        });
        process.exit();
    })
    .catch(function (error) {
        console.log(error);
        process.exit();
    });

function getFileName() {
    var today = new Date();
    var str = (today.getMonth() + 1) + "-" + today.getDate() + "-" + today.getFullYear();
    return './downloads/' + str;
}
