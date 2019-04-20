let express = require("express");
let request = require("request");
let cors = require("cors");
let querystring = require("querystring");
let cookieParser = require("cookie-parser");
require("dotenv").config();

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
let generateRandomString = length => {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

let stateKey = "spotify_auth_state";

let app = express();

app.use(cors()).use(cookieParser());

let redirect_uri = process.env.REDIRECT_URI || "http://localhost:8888/callback";

app.get("/login", function(req, res) {
  let state = generateRandomString(16);
  res.cookie(stateKey, state);

  // application requests authorization
  let scope =
    "user-read-private user-read-email playlist-modify-private playlist-modify-public";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      })
  );
});

//redirect link that retrieves a token
app.get("/callback", function(req, res) {
  let uri = process.env.FRONTEND_URI || "http://localhost:3000";
  let code = req.query.code || null;
  let state = req.query.state || null;
  let storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(uri + querystring.stringify({ error: "state_mismatch" }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri,
        grant_type: "authorization_code"
      },
      headers: {
        Authorization:
          "Basic " +
          new Buffer(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64")
      },
      json: true
    };
  }

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      let access_token = body.access_token,
        refresh_token = body.refresh_token;

      let uri = process.env.FRONTEND_URI || "http://localhost:3000";
      res.redirect(
        uri +
          "?access_token=" +
          access_token +
          "&refresh_token=" +
          refresh_token
      );
    } else {
      res.redirect(
        uri +
          querystring.stringify({
            error: "invalid_token"
          })
      );
    }
  });
});

let port = process.env.PORT || 8888;
console.log(
  `Listening on port ${port}. Go /login to initiate authentication flow.`
);
app.listen(port);
