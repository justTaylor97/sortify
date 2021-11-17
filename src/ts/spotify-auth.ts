const Hapi = require("@hapi/hapi");
const axios = require("axios");
import logger from "./logger";
const { client_id, client_secret, scopes } = require("./client.json");

type AccessToken = {
  access_token: string;
};

// sets base64Client
const base64Client = Buffer.from(`${client_id}:${client_secret}`).toString(
  "base64"
);

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

    let url = "https://accounts.spotify.com/authorize?response_type=code";
    url += `&client_id=${client_id}`;
    url += `&scope=${encodeURIComponent(scopes.join(" "))}`;
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
        }),
        // TODO: generalize redirect_uri
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${base64Client}`,
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
      }),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${base64Client}`,
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
