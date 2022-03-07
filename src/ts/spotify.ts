const axios = require("axios");
const fs = require("fs");
const inquirer = require("inquirer");
const { DateTime } = require("luxon");
const auth = require("./spotify-auth");
let { ignoredTags, prompts } = require("../conf/tags.json");
import logger from "./logger";

const spotify = axios.create({ baseURL: "https://api.spotify.com/v1/" });
let { access_token, refresh_token } = require("../conf/token.json");

// TODO: separate calls into components and then pull together in import and reexport
/**
 * Checks the token on process startup.
 */
export const checkToken = async () => {
  if (access_token == undefined) {
    updateToken(await auth.setToken(refresh_token));
  }
  return getCurrentPlayback()
    .catch(async () => {
      // TODO: move this to an on unhandled rejection catchall
      console.info("Access token expired, trying to refresh.");
      updateToken(await auth.refreshToken(refresh_token));
      // FIXME: when this fails it logs the error despite the catch
      return getCurrentPlayback();
    })
    .catch(async () => {
      console.info("Refresh failed, requesting new token.");
      updateToken(await auth.setToken());
      return getCurrentPlayback();
    });
};

/**
 * Updates the cached token data in token.json
 * @param {*} data The access_token, refresh_token, and other token data.
 */
export const updateToken = (data: any) => {
  data = {
    refresh_token,
    ...data,
  };
  access_token = data.access_token;
  fs.writeFile(
    `${__dirname}/../conf/token.json`,
    JSON.stringify(data, null, 2),
    (err: Error) => {
      if (err) {
        throw err;
      }
      logger.info("token.json updated!");
    }
  );
};

/**
 * Get information about the user’s current playback state, including track or episode, progress, and active device.
 */
export const getCurrentPlayback = () => {
  return spotify.get("me/player/currently-playing", {
    params: {
      market: "from_token",
    },
    headers: { Authorization: `Bearer ${access_token}` },
  });
};

/**
 * Gets the given playlist
 * @param {*} playlistId
 * @returns
 */
export const getPlaylist = (playlistId: string, opts = {}) => {
  return spotify.get(`playlists/${playlistId}`, {
    params: opts,
    headers: { Authorization: `Bearer ${access_token}` },
  });
};

/**
 * Gets the given playlist
 * @param {*} playlistId
 * @returns
 */
export const overwritePlaylist = (playlistId: string, uris: string[]) => {
  return spotify.put(
    `playlists/${playlistId}/tracks`,
    { uris },
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );
};

/**
 * Get information about the user’s current playback state, including track or episode, progress, and active device.
 */
export const getTrackAudioFeatures = (trackIds: string | string[]) => {
  if (typeof trackIds == "string") {
    return spotify.get(`audio-features/${trackIds}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
  } else {
    let ids = "";
    trackIds.forEach((trackId) => {
      ids += `${trackId},`;
    });
    return spotify.get(`audio-features`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { ids },
    });
  }
};

/**
 * Remove song from Liked Songs
 * @param {*} song
 */
export const unlikeSong = (song: any) => {
  return spotify
    .delete("me/tracks", {
      params: {
        ids: song.id,
      },
      headers: { Authorization: `Bearer ${access_token}` },
    })
    .then(() => {
      logger.info(
        `Track '${song.name}' by ${artistsToString(
          song.artists
        )} has been removed from Liked Songs.`
      );
    });
};

export const artistsToString = (artists: any) => {
  return artists.reduce(
    (accumulator: string, artist: any, index: number, artists: any[]) => {
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
};

/**
 * Gets 50 of the current users playlists.
 * @param {*} offset What index playlist to start fetching from.
 * @returns
 */
export const getPlaylists = (offset = 0) => {
  return spotify.get("me/playlists", {
    params: { limit: 50, offset },
    headers: { Authorization: `Bearer ${access_token}` },
  });
};

/**
 * Gets all of the current user's playlists.
 * @returns
 */
export const getAllPlaylists = async () => {
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

export const playlistIncludes = (playlist: any, song: any) => {
  return spotify
    .get(`playlists/${playlist}/tracks`, {
      param: { market: "from_token" },
      headers: { Authorization: `Bearer ${access_token}` },
    })
    .then(({ data }: { data: any }) => {
      let playlistIncludesSong = false;
      data.items.forEach((item: any) => {
        if (item.track.uri === song) {
          playlistIncludesSong = true;
        }
      });
      return playlistIncludesSong;
    });
};

// TODO: in ts make this work for arrays
export const addToPlaylist = async (playlist: any, song: any) => {
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
