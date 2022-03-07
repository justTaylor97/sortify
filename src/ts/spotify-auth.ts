const Hapi = require("@hapi/hapi");
const axios = require("axios");
const fs = require("fs");
const pkceChallenge = require("pkce-challenge");
import logger from "./logger";
let { code_verifier, code_challenge } = require("../conf/pkce.json");

// client_id and scopes
const client_id = "3b2819276c5f46bd9eec240d553366a2";
const scopes = [
  "user-read-private",
  "user-read-email",
  "user-read-currently-playing",
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-private",
  "user-library-modify",
  "playlist-read-collaborative",
];

type AccessToken = {
  access_token: string;
};

const server = Hapi.server({
  port: 8888,
  host: "localhost",
});

const start = () => {
  return new Promise<string>(async (resolve) => {
    server.route({
      method: "GET",
      path: "/callback",
      handler: async ({ query: { code } }: { query: { code: string } }) => {
        resolve(code);
        return "Success. You may close this tab.";
      },
    });

    await server.start();
    logger.debug("Server running on %s\n", server.info.uri);

    // generate pkce challenge
    const challenge = pkceChallenge();
    code_challenge = challenge.code_challenge;
    code_verifier = challenge.code_verifier;

    // updated pkce.json with new values
    fs.writeFile(
      `${__dirname}/../conf/pkce.json`,
      JSON.stringify({ code_challenge, code_verifier }, null, 2),
      (err: Error) => {
        if (err) {
          logger.err(err);
        } else {
          logger.debug("pkce values updated!");
        }
      }
    );

    let url = "https://accounts.spotify.com/authorize?response_type=code";
    url += `&client_id=${client_id}`;
    url += `&scope=${encodeURIComponent(scopes.join(" "))}`;
    url += `&code_challenge_method=${encodeURIComponent("S256")}`;
    url += `&code_challenge=${encodeURIComponent(code_challenge)}`;
    url += `&redirect_uri=${encodeURIComponent(
      "http://localhost:8888/callback"
    )}`;
    logger.info(`Click to authorize app: ${url}`);
  });
};

process.on("unhandledRejection", (err) => {
  logger.error(err);
  process.exit(1);
});

const setToken = () => {
  return start()
    .then((code: string) => {
      return axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: "http://localhost:8888/callback",
          client_id: client_id,
          code_verifier: code_verifier,
        }),
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          params: {},
        }
      );
    })
    .then(({ data }) => {
      server.stop();
      return data;
    });
};

const refreshToken = (refresh_token: string) => {
  return axios
    .post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
        client_id: client_id,
        code_verifier: code_verifier,
      }),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        params: {},
      }
    )
    .then(({ data }: { data: AccessToken }) => {
      logger.debug(data);
      return data;
    })
    .catch((err: Error) => {
      logger.error(err);
    });
};

module.exports = {
  setToken: setToken,
  refreshToken: refreshToken,
};
