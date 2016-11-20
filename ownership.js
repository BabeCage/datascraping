var Nightmare = require('nightmare');
require('nightmare-inline-download')(Nightmare);
var fs = require('fs');
var http = require('http');
var nightmare = nightmareFactory();

loginToDK('', '')
    .then(getDailyFantasyLinks)
    .catch(function (error) {
        console.log(error);
        process.exit();
    });

function clearDKCookies() {
    return nightmare
        .goto('https://www.draftkings.com/account/sitelogin/false?returnurl=%2Flobby')
        .cookies.clearAll();
}

function loginToDK(username, password) {
    return nightmare
        .goto('https://www.draftkings.com/account/sitelogin/false?returnurl=%2Flobby')
        .wait()
        .type('#Username.textbox', username)
        .type('#Password.textbox', password)
        .click('#loginButton')
        .wait(function () {
            return window.location.href
                .indexOf('https://www.draftkings.com/lobby') > -1;
        });
}

function getDailyFantasyLinks() {
    nightmare.goto('https://rotogrinders.com/threads/category/main')
        .wait()
        .evaluate(function () {
            var topics = document.querySelectorAll('td.topic > a');
            return Array.prototype.map.call(topics, function (link) {
                return {
                    title: link.innerText,
                    href: link.href
                };
            });
        })
        .then(function (topics) {
            var dailyFantasyLinks = topics.filter(function (topic) {
                return topic.title.indexOf('Daily Fantasy Tournament Links') === 0;
            });
            var tasks = dailyFantasyLinks.map(function (link) {
                return getDKLinks(link.href, link.title);
            });
            Promise.all(tasks).then(function () {
                console.log('success');
                tasks.forEach(function (task) {
                    console.log(task.date + ':' + task.link);
                });
                process.exit();
            }).catch(function (error) {
                console.log(error);
                process.exit();
            });
        })
        .catch(function (error) {
            console.log(error);
            process.exit();
        });
}

function getDKLinks(mainPage, contestDate) {
    return new Promise(function (resolve) {
        nightmare.goto(mainPage)
            .wait()
            .evaluate(function () {
                var links = document.querySelectorAll('p > a');
                return Array.prototype.filter.call(links, function (link) {
                    var href = link.getAttribute('href');
                    var isDraftKings = href.indexOf('http://partners.draftkings.com') === 0;
                    var isDoubleUp = link.innerText.indexOf('DOUBLE UP') > -1;
                    return isDraftKings && isDoubleUp;
                }).map(function (dkDoubleUp) {
                    return {
                        href: dkDoubleUp.getAttribute('href'),
                        title: dkDoubleUp.innerText
                    };
                });
            })
            .then(function (draftKingDoubleUpLinks) {
                var tasks = draftKingDoubleUpLinks.map(function (link) {
                    return {
                        href: link.href,
                        title: link.title,
                        date: contestDate
                    };
                });
                resolve(tasks);
            });
    });
}

function getFileName(contestTitle, contestDate) {
    var fileName = [contestTitle.trim(), parseContestDate(contestDate)]
        .join('_').replace(/[^\w]/g, '');
    return './downloads/' + fileName + '.zip';
}

function downloadOwnership(dkLink, contestTitle, contestDate) {
    nightmareFactory().goto(dkLink)
        .wait('#export-lineups-csv')
        .evaluate(function () {
            var exportLink = document.querySelector('#export-lineups-csv');
            return exportLink.href;
        })
        .then(function (href) {
            console.log("href: " + href);
        });
}

function parseContestDate(contestDate) {
    return contestDate.replace(/Daily Fantasy Tournament Links/, '');
}

function nightmareFactory() {
    return new Nightmare({
        webPreferences: {
            partition: 'nopersist'
        }
    }).useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36");
}
