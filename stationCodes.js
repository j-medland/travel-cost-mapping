// this was used to convert the csv file at the following URL to json data
// from http://www.nationalrail.co.uk/stations_destinations/48541.aspx
const fs = require('fs')

const codes = fs.readFileSync('station_codes.csv', 'utf-8').split('\r\n').slice(1).map(line => {
    line = line.split(',')
    return {
        name: line[0],
        code: line[1]
    }
})

fs.writeFileSync('station-codes.json', JSON.stringify(codes, null, 2))