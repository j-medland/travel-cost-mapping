const puppeteer = require('puppeteer')
const path = require('path')
fs = require('fs')


async function getPrices(routes) {
    // fire up headless chrome
    const browser = await puppeteer.launch();
    // create a page
    const page = await browser.newPage();
    // create an array to store the output in
    // iterate through routes and fire off price requests
    const pricedRoutes = routes.map(async route => {
        // use default values for time if not specified in object
        const on = route.on || 'today'
        const at = route.at || getSuitableTime()
            // build url
        url = `https://ojp.nationalrail.co.uk/service/timesandfares/${route.from}/${route.to}/${on}/${at}/dep`
        console.log(`Requesting ${url}`)
        await page.goto(url, { waitUntil: 'networkidle' })
        return page.$eval('label[for^=faresingleFareOutward]', (e, route) => {
            console.log(route, e)
            route.cost = e.innerHTML.match(/£([0-9\.]*)/)[1]
            return route
        }, route)
    })

    routes = Promise.all(pricedRoutes).then(routes => {
        fs.writeFileSync('out.json', JSON.stringify(routes))
        console.log('closing')
        browser.close()
    }).catch(err => {
        console.log(err)
        try {
            browser.close()
        } catch (e) {
            //do nothing
        }
    })


    // helper funciton
    function getSuitableTime() {
        d = new Date()
        return `${d.getHours(d.setHours(d.getHours()+1))}00`
    }
}

//define an array of routes
const routes = [{
    from: 'CHO',
    to: 'OXF'
}]


// run code
getPrices(routes)