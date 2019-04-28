const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const passport = require('passport');
const WebAppStrategy = require("ibmcloud-appid").WebAppStrategy;
const CALLBACK_URL = "/ibm/cloud/appid/callback";
let loginRedirectUri = "";

const env = process.env.NODE_ENV || 'dev';
if(env === 'dev') {
  loginRedirectUri = `http://localhost:8080/${CALLBACK_URL}`;
} else {
  loginRedirectUri = `http://node-weather-report.eu-gb.mybluemix.net/${CALLBACK_URL}`;
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

app.get(CALLBACK_URL, passport.authenticate(WebAppStrategy.STRATEGY_NAME));
app.get('/login', passport.authenticate(WebAppStrategy.STRATEGY_NAME), function(req, res) {
  res.redirect('/')
});

app.get("/logout", function (req, res) {
  WebAppStrategy.logout(req);
  res.redirect("/");
});

app.get('/', function (req, res) {
  res.render("home", {
    user: req.user
  });
});

app.listen(port);

require("cf-deployment-tracker-client").track();
