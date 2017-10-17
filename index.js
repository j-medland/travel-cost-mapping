const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

// sleep between request (ms)
const sleep = 20000

// read in station list
let stations = JSON.parse(fs.readFileSync('station-codes.json', 'utf-8'))
let numberOfStations = stations.length

// artificially clip number of stations for testing
numberOfStations = 2

// run code
getPrices()

async function getPrices() {
    // determine how many requests will be made
    const numberOfReq = Math.pow(2, numberOfStations - 1) - 1

    console.log(`============== Total number of routes to search: ${numberOfReq} ==============`)

    // open file stream to output to
    wstream = fs.createWriteStream('priced-routes.json')
    wstream.write('[')
    let sep = ''

    // fire up headless chrome
    const browser = await puppeteer.launch();

    let count = 0
        // iterate through routes and fire off price requests
    for (let fromIndex = 0; fromIndex < numberOfStations; fromIndex++) {
        for (let toIndex = fromIndex + 1; toIndex < numberOfStations; toIndex++) {
            if (fromIndex != toIndex) {
                // increment count
                count++
                const route = { from: stations[fromIndex].code, to: stations[toIndex].code }
                    // create a page
                const page = await browser.newPage();
                // build url
                url = `https://ojp.nationalrail.co.uk/service/timesandfares/${route.from}/${route.to}/today/${getSuitableTime()}/dep`
                console.log(`Requesting (${count} of ${numberOfReq}) ${url}`)
                    // try to request page and get price
                try {
                    await page.goto(url, { waitUntil: 'networkidle' })
                    const price = await page.$eval('label[for^=faresingleFareOutward]', element => element.innerHTML.match(/£([0-9\.]*)/)[1])
                    route.price = price
                    console.log(`£${price}`)
                        // write out route
                    wstream.write(sep + JSON.stringify(route))
                    if (!sep) {
                        sep = ','
                    }
                } catch (e) {
                    // something didn't work but we don't want to stop
                    console.log(e)
                }
                page.close().catch(err => { /*ignore error*/ })
                    // sleep to avoid dos attack
                if (count != numberOfReq) {
                    await new Promise(resolve => setTimeout(resolve, sleep))
                }
            }
        }
    }

    // finish output
    wstream.end(']')
        // close stuff
    browser.close()
    console.log('==============     All done     ==============')


    // helper funciton
    function getSuitableTime() {
        d = new Date()
        return `${d.getHours(d.setHours(d.getHours()+1))}00`
    }
}