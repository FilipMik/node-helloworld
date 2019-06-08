const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const passport = require('passport');
const WebAppStrategy = require("ibmcloud-appid").WebAppStrategy;
const weatherApi = new (require('./services/weather'))('https://3b6bc957-59e7-4fc2-bc13-b4c999737feb:RsxzpoB1Di@twcservice.eu-gb.mybluemix.net');
const userRepository = new (require('./services/storage'))('https://fcecbc9c-4de4-4711-8614-953660d677c7-bluemix.cloudantnosqldb.appdomain.cloud');
const CALLBACK_URL = "/ibm/cloud/appid/callback";
let loginRedirectUri = "";

const env = process.env.NODE_ENV || 'dev';
if(env === 'dev') {
  loginRedirectUri = `http://localhost:8080${CALLBACK_URL}`;
} else {
  loginRedirectUri = `http://node-weather-report.eu-gb.mybluemix.net${CALLBACK_URL}`;
}

app = express();

app.use(session({
  secret: "123456",
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize(null));
app.use(passport.session(null));

passport.use(new WebAppStrategy({
  tenantId: "7db0a1ca-4709-4ad6-9f95-f01320c7d436",
  clientId: "ee18bdd1-ca39-4df9-88f0-f21734ba4a20",
  secret: "OTJlNDgxNmUtODAwOS00OWQzLTljZGUtMzQzOWQ5ZDg1YmNl",
  oauthServerUrl: "https://eu-gb.appid.cloud.ibm.com/oauth/v4/7db0a1ca-4709-4ad6-9f95-f01320c7d436",
  redirectUri: loginRedirectUri
}));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

var port = process.env.PORT || 8080;


app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(express.urlencoded());

app.get(CALLBACK_URL, passport.authenticate(WebAppStrategy.STRATEGY_NAME));
app.get('/login', passport.authenticate(WebAppStrategy.STRATEGY_NAME), async function (req, res) {
  await userRepository.createUser(req.user.email);
  res.redirect('/');
});

app.get("/logout", function (req, res) {
  WebAppStrategy.logout(req);
  res.redirect("/");
});

app.post("/city", async function (req, res) {
  let city = req.body.city;
  let foundCity = await weatherApi.findCity(city);
  if(foundCity) {
    let currentUser = await userRepository.getCurrentUser(req.user.email);
    currentUser.cities.push(foundCity);
    await userRepository.updateCurrentUser(currentUser);
  }
  res.redirect("/");
});

app.post("/city/delete", async function (req, res) {
  var currentUser = await userRepository.getCurrentUser(req.user.email);
  for (let i = 0; i < currentUser.cities.length; i++) {
    if (currentUser.cities[i]._displayName === req.body.city) {
      currentUser.cities.splice(i, 1);
    }
  }
  await userRepository.updateCurrentUser(currentUser);
  res.redirect("/");
});

app.get('/detail/:name', async function (req, res) {
  let name = req.params.name;
  let user = await userRepository.getCurrentUser(req.user.email);
  let city = user.cities.find(function (c) {
    return c._displayName === name;
  });

  let forecast = await weatherApi.getForecastForCity(city);
  res.render("detail", {
    forecast: forecast,
    city: city,
    user: req.user
  })
});

app.get('/', async function (req, res) {
  let cities = [];
  if (req.user) {
    let currentUser = await userRepository.getCurrentUser(req.user.email);
    cities = currentUser.cities;
    for (var city of cities) {
      city._temperature = await weatherApi.getTemperatureForCity(city);
    }
  }

  res.render("home", {
    user: req.user,
    cities: cities
  });
});

app.listen(port);

require("cf-deployment-tracker-client").track();
