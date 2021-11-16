const axios = require("axios");
const fs = require("fs");
const inquirer = require("inquirer");
const { DateTime } = require("luxon");
const auth = require("./auth");
const prompts = require("./prompts.json");

const spotify = axios.create({ baseURL: "https://api.spotify.com/v1/" });
let { access_token, refresh_token } = require("./token.json");

// TODO: convert this to typescript
// TODO: add comprehensive JSDoc comments
/**
 * Checks the token on process startup.
 */
const checkToken = async () => {
  if (access_token == undefined) {
    updateToken(await auth.setToken(refresh_token));
  }
  return getCurrentPlayback()
    .catch(async () => {
      // TODO: move this to an on unhandled rejection catchall
      console.log("Access token expired, trying to refresh.");
      updateToken(await auth.refreshToken(refresh_token));
      // FIXME: when this fails it logs the error despite the catch
      return getCurrentPlayback();
    })
    .catch(async () => {
      console.log("Refresh failed, requesting new token.");
      updateToken(await auth.setToken());
      return getCurrentPlayback();
    });
};

/**
 * Get information about the user’s current playback state, including track or episode, progress, and active device.
 */
const getCurrentPlayback = () => {
  return spotify.get("me/player/currently-playing", {
    params: {
      market: "from_token",
    },
    headers: { Authorization: `Bearer ${access_token}` },
  });
};

/**
 * Updates the cached token data in token.json
 * @param {*} data The access_token, refresh_token, and other token data.
 */
const updateToken = (data) => {
  data = {
    refresh_token,
    ...data,
  };
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

/**
 * Remove song from Liked Songs
 * @param {*} song
 */
const unlikeSong = (song) => {
  return spotify
    .delete("me/tracks", {
      params: {
        ids: song.id,
      },
      headers: { Authorization: `Bearer ${access_token}` },
    })
    .then(() => {
      console.log(
        `Track '${current.item.name}' by ${artistString} has been removed from Liked Songs.`
      );
    });
};

/**
 * Gets 50 of the current users playlists.
 * @param {*} offset What index playlist to start fetching from.
 * @returns
 */
const getPlaylists = (offset = 0) => {
  return spotify.get("me/playlists", {
    params: { limit: 50, offset },
    headers: { Authorization: `Bearer ${access_token}` },
  });
};

/**
 * Gets all of the current user's playlists.
 * @returns
 */
const getAllPlaylists = async () => {
  let offset = 0;
  let data = (await getPlaylists(offset)).data;
  let allPlaylists = data.items;
  while (data.items.length > 0) {
    offset += 50;
    data = (await getPlaylists(offset)).data;
    allPlaylists = allPlaylists.concat(data.items);
  }
  return allPlaylists;
};

// TODO: in ts make this work for arrays
const addToPlaylist = async (playlist, song) => {
  if (!(await playlistIncludes(playlist, song))) {
    return spotify.post(
      `playlists/${playlist}/tracks`,
      {
        uris: [song],
      },
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
  }
};

const playlistIncludes = (playlist, song) => {
  return spotify
    .get(`playlists/${playlist}/tracks`, {
      param: { market: "from_token" },
      headers: { Authorization: `Bearer ${access_token}` },
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

const getPlaylistTags = async () => {
  let tagMap = new Map();
  let taggedPlaylists = [];
  let playlists = await getAllPlaylists();
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

const refreshPlaylistTags = async () => {
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
};

const tagSong = async (song) => {
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

  // ask tag questions from prompts.json
  await inquirer.prompt(prompts).then((answers) => {
    console.log(answers);
    for (let answer in answers) {
      tags = tags.concat(answers[answer]);
    }
  });

  return tags;
};

const sort = async (song) => {
  const allPlaylists = require("./playlists.json");
  let tags = await tagSong(song);

  console.log(tags);

  let playlists = allPlaylists.filter((playlist) => {
    let hasAll = playlist.mandatoryTags.every((tag) => tags.includes(tag));
    let hasAtLeastOne = true;
    if (playlist.optionalTags.length > 0) {
      hasAtLeastOne = playlist.optionalTags.some((tag) => tags.includes(tag));
    }
    let hasNone = !playlist.excludeTags.some((tag) => tags.includes(tag));

    if (hasAll && hasAtLeastOne && hasNone) {
      return playlist;
    }
  });

  return playlists;
};

// TODO: hide some of these functions.
module.exports = {
  checkToken,
  getCurrentPlayback,
  updateToken,
  artistsToString,
  unlikeSong,
  getPlaylists,
  getAllPlaylists,
  addToPlaylist,
  playlistIncludes,
  getPlaylistTags,
  refreshPlaylistTags,
  tagSong,
  sort,
};
