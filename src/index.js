#!/usr/bin/env node
const fs = require("fs");
const axios = require("axios");
const { program } = require("commander");
const { DateTime } = require("luxon");
const auth = require("./auth");

const spotify = axios.create({ baseURL: "https://api.spotify.com/v1/" });
let { access_token, refresh_token } = require("./token.json");

program
  .option(
    "-r, --refresh-playlists",
    "downloads all playlist tag info to playlists.json."
  )
  .option("-v, --verbose", "Displays more information.") // TODO: implement these
  .option("--no-sort", "doesn't sort the currently playing song.");
// TODO: add option to add tag to bucket
// TODO: misc tags
// TODO: explicit
// TODO: release date
program.parse(process.argv);
const options = program.opts();

const start = async () => {
  if (access_token == undefined) {
    let data = await auth.setToken();
    // TODO: convert token updating to a function?
    access_token = data.access_token;
    fs.writeFile(
      `${__dirname}/token.json`,
      JSON.stringify(data, null, 2),
      (err) => {
        if (err) {
          throw err;
        }
        console.log("token.json updated!");
      }
    );
  }
  let { data: current } = await spotify
    .get("me/player/currently-playing", {
      params: {
        market: "from_token",
      },
      headers: { Authorization: `Bearer ${access_token}` },
    })
    .catch(async () => {
      console.log("Access token expired, trying to refresh.");
      let data = await auth.refreshToken(refresh_token);
      access_token = data.access_token;
      data = {
        refresh_token,
        ...data,
      };
      fs.writeFile(
        `${__dirname}/token.json`,
        JSON.stringify(data, null, 2),
        (err) => {
          if (err) {
            throw err;
          }
          console.log("token.json updated!");
        }
      );
      return spotify.get("me/player/currently-playing", {
        params: {
          market: "from_token",
        },
        headers: { Authorization: `Bearer ${access_token}` },
      });
    })
    .catch(async () => {
      console.log("Refresh failed, requesting new token.");
      let data = await auth.setToken(refresh_token);
      access_token = data.access_token;
      fs.writeFile(
        `${__dirname}/token.json`,
        JSON.stringify(data, null, 2),
        (err) => {
          if (err) {
            throw err;
          }
          console.log("token.json updated!");
        }
      );
      return spotify.get("me/player/currently-playing", {
        params: {
          market: "from_token",
        },
        headers: { Authorization: `Bearer ${access_token}` },
      });
    });

  // TODO: move to a function
  // build a string with the artists
  let artistString = artistsToString(current.item.artists);

  console.log(
    `Currently listening to '${current.item.name}' by ${artistString}.`
  );

  console.log("Release Date:", current.item.album.release_date);
  console.log("Explicit:", current.item.explicit);
  console.log("Popularity:", current.item.popularity);

  // fetch all playlists for caching and tagging
  if (options.refreshPlaylists) {
    console.log("Downloading playlists with tag information...");
    let { taggedPlaylists, tagMap } = await getPlaylistTags(access_token);
    console.log(tagMap);
    fs.writeFile(
      `${__dirname}/playlists.json`,
      JSON.stringify(taggedPlaylists, null, 2),
      (err) => {
        if (err) {
          throw err;
        }
        console.log("playlists.json updated!");
      }
    );
  }

  if (options.sort) {
    let tags = sort(current.item);
    console.log(tags);
  }

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
  // TODO: confirm or manually add and remove playlists.
};

start();

const getPlaylists = (token, offset = 0) => {
  return spotify.get("me/playlists", {
    params: { limit: 50, offset },
    headers: { Authorization: `Bearer ${token}` },
  });
};

const getAllPlaylists = async (token) => {
  let offset = 0;
  let data = (await getPlaylists(token, offset)).data;
  let allPlaylists = data.items;
  while (data.items.length > 0) {
    offset += 50;
    data = (await getPlaylists(token, offset)).data;
    allPlaylists = allPlaylists.concat(data.items);
  }
  return allPlaylists;
};

const getPlaylistTags = async (token) => {
  let tagMap = new Map();
  let taggedPlaylists = [];
  let playlists = await getAllPlaylists(token);
  playlists.forEach((playlist) => {
    if (playlist.description != undefined && playlist.description != "") {
      let tags = playlist.description.split("#");
      let mandatoryTags = [];
      let optionalTags = [];
      let excludeTags = [];
      tags.shift();

      tags.forEach((tag) => {
        let name = playlist.name;
        tag = tag.trim();
        if (tag[0] == "?") {
          tag = tag.substring(1);
          optionalTags.push(tag);
          name = `?${name}`;
        } else if (tag[0] == "!") {
          tag = tag.substring(1);
          excludeTags.push(tag);
          name = `!${name}`;
        } else {
          mandatoryTags.push(tag);
        }

        if (tagMap.has(tag)) {
          tagMap.set(tag, tagMap.get(tag).concat([name]));
        } else {
          tagMap.set(tag, [name]);
        }
      });
      if (
        (mandatoryTags.length !== 0) |
        (optionalTags.length !== 0) |
        (excludeTags.length != 0)
      ) {
        taggedPlaylists.push({
          name: playlist.name,
          uri: playlist.uri,
          mandatoryTags,
          optionalTags,
          excludeTags,
        });
      }
    }
  });
  return {
    taggedPlaylists: taggedPlaylists,
    tagMap: tagMap,
  };
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

const artistsToString = (artists) => {
  return artists.reduce((accumulator, artist, index, artists) => {
    if (index === 0) {
      return artist.name;
    } else if (index === artists.length - 1) {
      return `${accumulator}, and ${artist.name}`;
    } else {
      return `${accumulator}, ${artist.name}`;
    }
  }, "");
};

const sort = (song) => {
  let tags = [];

  if (!song.explicit) {
    tags.push("clean");
  }

  if (song.popularity > 90) {
    tags.push("trendy");
  }

  let release = DateTime.fromISO(song.album.release_date);
  if (release < DateTime.fromISO("1940")) {
    tags.push("oldies");
  } else if (release < DateTime.fromISO("1950")) {
    tags.push("40s");
  } else if (release < DateTime.fromISO("1960")) {
    tags.push("50s");
  } else if (release < DateTime.fromISO("1970")) {
    tags.push("60s");
  } else if (release < DateTime.fromISO("1980")) {
    tags.push("70s");
  } else if (release < DateTime.fromISO("1990")) {
    tags.push("80s");
  } else if (release < DateTime.fromISO("2000")) {
    tags.push("90s");
  } else if (release < DateTime.fromISO("2010")) {
    tags.push("00s");
  } else if (release < DateTime.fromISO("2020")) {
    tags.push("10s");
  } else {
    tags.push("20s");
  }

  // TODO: add manual tag questionaire

  return tags;
};
