const Hapi = require("@hapi/hapi");
const axios = require("axios");
const { client_id, client_secret, scopes } = require("./client.json");

// sets base64Client
const base64Client = new Buffer.from(`${client_id}:${client_secret}`).toString(
  "base64"
);

// TODO: convert to TypeScript
const server = Hapi.server({
  port: 8888,
  host: "localhost",
});

const start = () => {
  return new Promise(async (resolve) => {
    server.route({
      method: "GET",
      path: "/callback",
      handler: async ({ query: { code } }) => {
        resolve(code);
        return "Success";
      },
    });

    await server.start();
    console.log("Server running on %s\n", server.info.uri);

    url = "https://accounts.spotify.com/authorize?response_type=code";
    url += `&client_id=${client_id}`;
    url += `&scope=${encodeURIComponent(scopes.join(" "))}`;
    url += `&redirect_uri=${encodeURIComponent(
      "http://localhost:8888/callback"
    )}`;
    console.log(`Click to authorize app: ${url}`);
  });
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

const setToken = () => {
  return start()
    .then((code) => {
      return axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: "http://localhost:8888/callback",
        }),
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

const refreshToken = (refresh_token) => {
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
    .then(({ data }) => {
      return data;
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = {
  setToken: setToken,
  refreshToken: refreshToken,
};
