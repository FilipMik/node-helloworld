
let axios = require('axios');

class WeatherApi {
    constructor(url) {
        this.url = url
    }

    findCity(name) {
        return axios.get(this.url + '/api/weather/v3/location/search?query='+name + '&language=en-US')
            .then(t => {
                return new City(t.data.location.displayName[0], t.data.location.latitude[0], t.data.location.longitude[0])
            });
    }

    getTemperatureForCity(city) {
        return axios.get(`${this.url}/api/weather/v1/geocode/${city._latitude}/${city._longitude}/observations.json?language=cs-CZ`)
            .then(t => {
                return t.data.observation.temp;
            })
    }
}

class City {
    constructor(displayName, latitude, longitude) {
        this._displayName = displayName;
        this._latitude = latitude;
        this._longitude = longitude;
    }
}

module.exports = WeatherApi;