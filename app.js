require('dotenv-extended').load();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const restify = require('restify');
const rp = require('request-promise');
const puppeteer = require('puppeteer');

const timeout = ms => new Promise((resolve, reject) => setTimeout(resolve, ms))

const server = restify.createServer();
server.listen(process.env.PORT || 8080, () => {
    console.log('%s listening to %s', server.name, server.url);
});

server.get('/api/:location', async (req, res, next) => {
    const location = req.params.location;
    const weatherData = await getWeatherData(location);

    if (weatherData == null) {
        // this means we got some error. we return Internal Server Error
        res.writeHead(500);
        res.end();
        next();
        return;
    }

    const x = weatherData.map(item => "'" + item.date + "'").join(',');
    const low = weatherData.map(item => item.min).join(',');
    const high = weatherData.map(item => item.max).join(',');

    const _x2 = [];
    const _hrs = [];
    weatherData.map(item => item.hourly).forEach(hr => hr.forEach(hri => _x2.push(hri.date)));
    weatherData.map(item => item.hourly).forEach(hr => hr.forEach(hri => _hrs.push(hri.temp)));
    const x2 = _x2.map(d => "'" + d + "'").join(',');
    const hrs = _hrs.join(',');

    let data = fs.readFileSync('cardTemplate.html', 'utf8');
    data = data.replace('{ X }', x);
    data = data.replace('{ LOW }', low);
    data = data.replace('{ HIGH }', high);
    data = data.replace('{ X2 }', x2);
    data = data.replace('{ HR }', hrs);

    const cardData = await renderHtml(data, 764, 400);

    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': cardData.length
    });

    res.end(cardData);

    next();
});

async function getWeatherData(location) {
    const uri = `https://api.worldweatheronline.com/premium/v1/past-weather.ashx?key=${process.env.WEATHER_KEY}&q=${encodeURIComponent(location)}&format=json&date={start}&enddate={end}&tp=1`;
    const start = moment().add(-30, 'days');
    const end = moment().startOf('day');

    const data = [];
    let done = false;
    let errorCount = 0;
    while (!done) {
        const startStr = start.format('YYYY-MM-DD');
        const endStr = end.format('YYYY-MM-DD');
        const reqUri = uri.replace('{start}', startStr).replace('{end}', endStr);
        console.log(`fetching ${reqUri}`);

        try {
            const rawResponse = await rp({ uri: reqUri, json: true });
            const response = rawResponse.data.weather.map(item => {
                return {
                    date: item.date + '-0',
                    min: item.mintempF,
                    max: item.maxtempF,
                    hourly: item.hourly.map(hr => {
                        let date = moment(item.date);
                        date.hour(parseInt(hr.time) / 100);
                        date.minute(0); date.second(0);
                        return {
                            date: date.format('YYYY-MM-DD-HH'),
                            temp: hr.tempF
                        }
                    })
                };
            });
            response.forEach(item => { data.push(item) });
            done = true;
        } catch (error) {
            errorCount++;
            if (errorCount >= 3) return null;
            console.error('error... retrying');
            await timeout(3 * 1000);
        }
    }

    return data;
}

async function renderHtml(html, width, height) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: width, height: height });
    await page.goto(`data:text/html,${html}`, { waitUntil: 'load' });
    const pageResultBuffer = await page.screenshot({ omitBackground: true, encoding: 'base64' });
    await page.close();
    browser.disconnect();
    return pageResultBuffer;
}