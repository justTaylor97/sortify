const axios = require("axios");
const fs = require("fs");
const inquirer = require("inquirer");
const { DateTime } = require("luxon");
const auth = require("./spotify-auth");
let { ignoredTags, prompts } = require("./tags.json");
import logger from "./logger";

const spotify = axios.create({ baseURL: "https://api.spotify.com/v1/" });
let { access_token, refresh_token } = require("./token.json");

// TODO: add comprehensive JSDoc comments
// TODO: pull out any non-general Spotify API specific functions into sort-track module
// TODO: clean up all 'any' type declarations
// TODO: create 'SpotifyPlaylist' type
// TODO: create 'SpotifyTrack' type
// TODO: create 'SpotifyTag' type
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
 * Get information about the user’s current playback state, including track or episode, progress, and active device.
 */
export const getTrackAudioFeatures = (trackId: string) => {
  return spotify.get(`audio-features/${trackId}`, {
    headers: { Authorization: `Bearer ${access_token}` },
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

export const getPlaylistTags = async () => {
  let tagMap = new Map();
  let taggedPlaylists: any[] = [];
  let playlists = await getAllPlaylists();
  let newTags: any[] = [];

  // compiles a list of current cached tags
  prompts.forEach((prompt: any) => {
    prompt.choices.forEach((tag: any) => {
      tagMap.set(tag, []);
    });
  });
  ignoredTags.forEach((tag: any) => {
    tagMap.set(tag, []);
  });

  playlists.forEach((playlist: any) => {
    if (playlist.description != undefined && playlist.description != "") {
      let tags = playlist.description.split("#");
      let mandatoryTags: any[] = [];
      let optionalTags: any[] = [];
      let excludeTags: any[] = [];
      tags.shift();

      tags.forEach((tag: any) => {
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
          logger.info(
            `New tag "${tag}" detected in playlist ${playlist.name}.`
          );
          newTags.push(tag);
          tagMap.set(tag, [name]);
        }
      });
      if (
        mandatoryTags.length !== 0 ||
        optionalTags.length !== 0 ||
        excludeTags.length != 0
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

  if (newTags.length > 0) {
    await importNewTags(newTags);
  }

  return {
    taggedPlaylists: taggedPlaylists,
    tagMap: tagMap,
  };
};

export const importNewTags = async (newTags: any) => {
  let tagPrompts: any[] = [];
  let categories: any[] = [];

  prompts.forEach((prompt: any, index: number) => {
    categories.push({ name: prompt.name, value: index });
  });
  categories.push({ name: "ignored (not recommended)", value: -1 });
  categories.push({ name: "skip", value: -2 });

  newTags.forEach((newTag: any) => {
    tagPrompts.push({
      name: newTag,
      type: "list",
      message: `New tag "${newTag}" detected. How do you want to categorize the new tag?"`,
      choices: categories,
    });
  });

  await inquirer.prompt(tagPrompts).then((answers: any[]) => {
    for (let tag in answers) {
      let index = answers[tag];
      if (index === -1) {
        ignoredTags.push(tag);
      } else if (index !== -2) {
        prompts[index].choices.push(tag);
      }
    }

    // sorts tags in a category alphabetically
    ignoredTags.sort();
    prompts.forEach((prompt: any) => {
      prompt.choices.sort();
    });

    // updates the tag json
    fs.writeFile(
      `${__dirname}/tags.json`,
      JSON.stringify({ prompts, ignoredTags }, null, 2),
      (err: Error) => {
        if (err) throw err;
        logger.info("tags updated!");
      }
    );
  });
};

export const refreshPlaylistTags = async () => {
  logger.info("Downloading playlists with tag information...");
  let { taggedPlaylists, tagMap } = await getPlaylistTags();
  logger.verbose(taggedPlaylists);
  logger.verbose(tagMap);
  fs.writeFileSync(
    `${__dirname}/playlists.json`,
    JSON.stringify(taggedPlaylists, null, 2)
  );
  logger.info("playlists.json updated!");
};

export const tagSong = async (song: any) => {
  let tags: any[] = [];

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
  await inquirer.prompt(prompts).then((answers: any[]) => {
    logger.verbose("Tags from prompts:");
    logger.verbose(answers);
    for (let answer in answers) {
      tags = tags.concat(answers[answer]);
    }
  });

  return tags;
};

export const suggestTagsForExclusion = (playlist: any, tags: any[]) => {
  // find potential negative tags for exclusion
  let potentialExcludeTags = tags.filter((tag) => {
    return !playlist.mandatoryTags.includes(tag);
  });
  potentialExcludeTags = potentialExcludeTags.filter((tag) => {
    return !playlist.optionalTags.includes(tag);
  });

  // finds optional tags not included for potential mandatory tagging
  let potentialMandatoryTags = playlist.optionalTags.filter((tag: any) => {
    return !tags.includes(tag);
  });

  logger.info(
    `Consider adding one or more of the following tags to the playlist '${playlist.name}' to prevent it from being incorrectly suggested for similar songs:`
  );

  potentialExcludeTags.forEach((tag) => {
    logger.info(`#!${tag}`);
  });

  potentialMandatoryTags.forEach((tag: any) => {
    logger.info(`#?${tag} -> #${tag}`);
  });

  // TODO: add a heatmap for tags?
  // TODO: use heatmap to suggest new mandatory tags to require based on previous patterns
};

export const suggestTagsForInclusion = (playlist: any, tags: []) => {
  // TODO: to exclude a playlist
  // TODO: add a mandatory tag
  // TODO: add a excludeTag
  // TODO: to include a playlist
  // TODO: add an include tag
  // TODO: change an include to an optional
  // TODO: remove an exclude
};

export const sort = async (song: any, options: any) => {
  const allPlaylists = require("./playlists.json");
  let tags = await tagSong(song);

  logger.verbose("All tags:");
  logger.verbose(tags);

  let playlists = allPlaylists.filter((playlist: any) => {
    let hasAll = playlist.mandatoryTags.every((tag: any) => tags.includes(tag));
    let hasAtLeastOne = true;
    if (playlist.optionalTags.length > 0) {
      hasAtLeastOne = playlist.optionalTags.some((tag: any) =>
        tags.includes(tag)
      );
    }
    let hasNone = !playlist.excludeTags.some((tag: any) => tags.includes(tag));

    if (hasAll && hasAtLeastOne && hasNone) {
      return playlist;
    }
  });

  playlists.forEach((playlist: any) => {
    logger.info(playlist.name);
  });

  let { correctPlaylists } = await inquirer.prompt({
    name: "correctPlaylists",
    type: "confirm",
    message: "Are these playlists correct",
  });

  if (!correctPlaylists) {
    let playlistChoices = allPlaylists.map((playlist: any) => {
      return {
        name: playlist.name,
        value: playlist,
        checked: playlists.some((selectedPlaylist: any) => {
          return selectedPlaylist.name == playlist.name;
        }),
      };
    });

    // TODO: custom searchable prompt
    playlists = await inquirer
      .prompt({
        name: "manualPlaylists",
        type: "checkbox",
        message: "Select the correct playlists",
        choices: playlistChoices,
      })
      .then(({ manualPlaylists }: { manualPlaylists: any[] }) => {
        if (options.suggestTags) {
          // Lists playlists removed from tag based suggestions
          let removedPlaylists = playlists.filter((playlist: any) => {
            return !manualPlaylists.includes(playlist);
          });
          removedPlaylists.forEach((removedPlaylist: any) => {
            suggestTagsForExclusion(removedPlaylist, tags);
          });

          // Lists playlists added to tag based suggestions
          let addedPlaylists = manualPlaylists.filter((manualPlaylist) => {
            return !playlists.includes(manualPlaylist);
          });

          addedPlaylists.forEach((addedPlaylist) => {
            suggestTagsForExclusion(addedPlaylist, tags);
          });
        }

        return manualPlaylists;
      });
  }

  let moveSong = await inquirer
    .prompt({
      name: "moveSong",
      type: "confirm",
      message: `Do you want to move '${song.name}' to the selected playlists?`,
    })
    .then(({ moveSong }: { moveSong: any }) => {
      return moveSong;
    });

  if (moveSong) {
    let movePromises: Promise<any>[] = [];
    playlists.forEach((playlist: any) => {
      movePromises.push(
        addToPlaylist(playlist.uri.split(":")[2], song.uri)
          .then((res) => {
            // TODO: put this in the function?
            if (res == undefined) {
              logger.info(`'${song.name}' is already in ${playlist.name}.`);
            } else {
              logger.info(
                `'${song.name}' has been successfully moved to ${playlist.name}.`
              );
            }
          })
          .catch((err) => {
            logger.error(`Error moving '${song.name}' to ${playlist.name}.`);
            logger.error(err);
          })
      );
    });
    Promise.all(movePromises).then(() => {
      unlikeSong(song);
    });
  }

  return playlists;
};
