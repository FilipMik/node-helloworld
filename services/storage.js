
let cloudant = require('@cloudant/cloudant');

class UserRepository {
    constructor(url) {
        this.cloudant = cloudant(
            {
                account: 'fcecbc9c-4de4-4711-8614-953660d677c7-bluemix',
                plugins: {
                    iamauth: {
                        iamApiKey: 'RO8RSJWFOGKR13rrs0oxSBr9B2XkpxjNdxDs2M3KVCPV'
                    }
                }
            })
    }

    async createUser(id) {
        if (!await this.getCurrentUser(id)) {
            await this.cloudant.db.use('weather_report').insert(new UserData(id))
        }
    }

    getCurrentUser(id) {
        return this.cloudant.db.use('weather_report').find({ selector: { _id:id } }).then(
            result => {
                return result.docs[0];
            }
        )
    }

    updateCurrentUser(userData) {
        this.cloudant.db.use('weather_report').insert(userData);
    }
}


class UserData {
    constructor(id) {
        this._id = id;
        this.cities = [];
    }
}

module.exports = UserRepository;

