#!/usr/bin/env node
const fs = require("fs");
const axios = require("axios");
const auth = require("./auth");
// TODO: inquirer?
// TODO: commander?

const spotify = axios.create({ baseURL: "https://api.spotify.com/v1/" });
let { access_token, refresh_token } = require("./token.json");

const start = async () => {
  if (access_token == undefined) {
    let data = await auth.setToken();
    access_token = data.access_token;
    fs.writeFile(
      `${__dirname}/token.json`,
      JSON.stringify(data, null, 2),
      (err, res) => {
        console.log(err);
        console.log(res);
      }
    );
  }
  let { data: current } = await spotify.get("me/player/currently-playing", {
    params: {
      market: "from_token",
    },
    headers: { Authorization: `Bearer ${access_token}` },
  });

  // TODO: move to a function
  // build a string with the artists
  let artistString = current.item.artists.reduce(
    (accumulator, artist, index, artists) => {
      if (index === 0) {
        return artist.name;
      } else if (index === artists.length - 1) {
        return `${accumulator}, and ${artist.name}`;
      } else {
        return `${accumulator}, ${artist.name}`;
      }
    },
    ""
  );

  console.log(
    `Currently listening to '${current.item.name}' by ${artistString}.`
  );

  // TODO: fetch all playlists for caching and tagging
  // let {
  //   data: { items: playlists },
  // } = await getPlaylists(access_token);
  // playlists.forEach((playlist) => {
  //   console.log(playlist.name);
  //   console.log(playlist.uri);
  // });

  // let playlistID = "0qLcANYAyF4sMipVPx5pCc";

  // addToPlaylist(access_token, playlistID, current.item.uri);
  // remove song from Liked Songs
  // spotify
  //   .delete("me/tracks", {
  //     params: {
  //       ids: current.item.id,
  //     },
  //     headers: { Authorization: `Bearer ${access_token}` },
  //   })
  //   .then(() => {
  //     console.log(
  //       `Track '${current.item.name}' by ${artistString} has been removed from Liked Songs.`
  //     );
  //   });
};

start();

const getPlaylists = (token, offset = 0) => {
  return spotify.get("me/playlists", {
    params: { limit: 50, offset },
    headers: { Authorization: `Bearer ${token}` },
  });
};

// TODO: in ts make this work for arrays
const addToPlaylist = async (token, playlist, song) => {
  if (!(await playlistIncludes(token, playlist, song))) {
    return spotify.post(
      `playlists/${playlist}/tracks`,
      {
        uris: [song],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }
};

const playlistIncludes = (token, playlist, song) => {
  return spotify
    .get(`playlists/${playlist}/tracks`, {
      param: { market: "from_token" },
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(({ data }) => {
      let playlistIncludesSong = false;
      data.items.forEach((item) => {
        if (item.track.uri === song) {
          playlistIncludesSong = true;
        }
      });
      return playlistIncludesSong;
    });
};
