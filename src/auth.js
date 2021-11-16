const Hapi = require("@hapi/hapi");
const axios = require("axios");
const { client_id, client_secret } = require("./client.json");

const server = Hapi.server({
  port: 8888,
  host: "localhost",
});

const init = async () => {
  await server.start();
  console.log("Server running on %s", server.info.uri);
  console.log();
  console.log(`Click to authorize app: ${urlBuilder()}`);
};

server.route({
  method: "GET",
  path: "/callback",
  handler: async ({ query: { code } }) => {
    setToken(code);
    return "Success";
  },
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();

function urlBuilder() {
  let scopes = "user-read-private user-read-email";
  let url = "";
  scopes = "&scope=" + encodeURIComponent(scopes);
  url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}${scopes}&redirect_uri=${encodeURIComponent(
    "http://localhost:8888/callback"
  )}`;
  return url;
}

const setToken = (code) => {
  let buff = new Buffer.from(`${client_id}:${client_secret}`);
  let base64Client = buff.toString("base64");
  return axios
    .post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        code: code,
        redirect_uri: "http://localhost:8888/callback",
        grant_type: "authorization_code",
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
      console.log(data);
      // TODO: write token
      // data.access_token
      // data.refresh_token
    })
    .catch((err) => {
      console.log(err);
    });
};
