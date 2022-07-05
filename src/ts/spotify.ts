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
export const getPlaylist = async (playlistId: string, opts = {}) => {
  let response = await spotify.get(`playlists/${playlistId}`, {
    params: opts,
    headers: { Authorization: `Bearer ${access_token}` },
  });

  // get number of songs fetched vs needed
  let totalSongs = response.data.tracks.total;
  let currentSongs = response.data.tracks.items.length;

  // sets fields for nested track queries
  let trackFields = (opts as any)?.fields ?? "";
  trackFields = trackFields.match(/tracks\((.*)\)/) ?? [, ""];
  trackFields = trackFields[1];

  // gets tracks with offset until the entire playlist has been fetched
  while (currentSongs < totalSongs) {
    let offsetResponse = await spotify.get(`playlists/${playlistId}/tracks`, {
      params: {
        ...opts,
        fields: trackFields,
        offset: currentSongs,
      },
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // add new tracks from offset playlist query
    let newTracks = offsetResponse.data.items;
    response.data.tracks.items = [...response.data.tracks.items, ...newTracks];

    // update currentSongs for eventual loop termination
    currentSongs = response.data.tracks.items.length;

    // update total song number to prevent potential race condition
    totalSongs = offsetResponse.data.total;
  }

  return response;
};

/**
 * Gets the given playlist
 * @param {*} playlistId
 * @returns
 */
export const overwritePlaylist = async (playlistId: string, uris: string[]) => {
  let snapshots = [];
  const chunkSize = 100;

  for (let i = 0; i < uris.length; i += chunkSize) {
    const chunk = uris.slice(i, i + chunkSize);

    // deletes old track locations
    let deleteSongs = chunk.map((uri) => {
      return { uri };
    });

    await spotify.delete(`playlists/${playlistId}/tracks`, {
      data: {
        tracks: deleteSongs,
      },
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // inserts new track locations
    let { data: chunkData } = await spotify.post(
      `playlists/${playlistId}/tracks`,
      { uris: chunk },
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    snapshots.push(chunkData.snapshot_id);
  }

  return snapshots;
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

export const removeFromPlaylist = async (playlistId: any, song: any) => {
  let { data: playlist } = await getPlaylist(playlistId);
  if (await playlistIncludes(playlistId, song.uri)) {
    return spotify
      .delete(`playlists/${playlistId}/tracks`, {
        data: { tracks: [{ uri: song.uri }] },
        headers: { Authorization: `Bearer ${access_token}` },
      })
      .then(() => {
        logger.info(
          `Track '${song.name}' by ${artistsToString(
            song.artists
          )} has been removed from ${playlist.name}.`
        );
      })
      .catch((err: Error) => {
        logger.error(
          `Error removing track '${song.name}' by ${artistsToString(
            song.artists
          )} from ${playlist.name}.`
        );
        logger.error(err);
      });
  } else {
    logger.info(
      `Track '${song.name}' by ${artistsToString(song.artists)} is not in ${
        playlist.name
      }.`
    );
  }
};

export const extractId = (link: string) => {
  // checks for URI formatted spotify links
  const regexURI = /spotify:[^:]*:(.*)/;
  let matchesURI = link.match(regexURI);
  if (matchesURI !== null) {
    return matchesURI[1];
  }
  // checks for URL formatted spotify links
  const regexURL = /https:\/\/open\.spotify\.com\/playlist\/([^?]*).*/;
  let matchesURL = link.match(regexURL);
  if (matchesURL !== null) {
    return matchesURL[1];
  }

  // if URI and URL fail, return the original link
  return link;
};
