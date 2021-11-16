const axios = require("axios");
const fs = require("fs");
const inquirer = require("inquirer");
const { DateTime } = require("luxon");
const auth = require("./spotify-auth");
let { ignoredTags, prompts } = require("./tags.json");
import logger from "./logger";

const spotify = axios.create({ baseURL: "https://api.spotify.com/v1/" });
let { access_token, refresh_token } = require("./token.json");

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
    `${__dirname}/token.json`,
    JSON.stringify(data, null, 2),
    (err: Error) => {
      if (err) {
        throw err;
      }
      console.info("token.json updated!");
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
