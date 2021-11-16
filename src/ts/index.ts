#!/usr/bin/env node
import { program } from "commander";
import * as sortSong from "./sort-song";
import logger from "./logger";

program
  .option(
    "-r, --refresh-playlists",
    "downloads all playlist tag info to playlists.json."
  )
  .option("-v, --verbose", "Displays more information.") // TODO: implement these
  .option(
    "-t --suggest-tags",
    "Suggest playlist tag changes based on the manual playlist selections."
  )
  .option("--no-sort", "Doesn't sort the currently playing song.")
  .option("-l, --level <level>", "The npm logging level to be displayed.");

// TODO: misc tags
// TODO: add sieve origin playlist selection as command line option
// TODO: add verbose logging to display playlist overlaps?
// TODO: add interface for tag category editing.

program.parse(process.argv);
const options = program.opts();

if (options.verbose) {
  logger.level = "verbose";
}

// TODO: handle weird cases in ts
if (options.level) {
  logger.level = options.level;
}

const start = async () => {
  let { data: current } = await sortSong.checkToken();
  if (current == "") {
    logger.warn("Please listen to a song to sort.");
  } else {
    let artistString = sortSong.artistsToString(current.item.artists);
    logger.info(
      `Currently listening to '${current.item.name}' by ${artistString}.`
    );

    logger.verbose(`Release Date: ${current.item.album.release_date}`);
    logger.verbose(`Explicit: ${current.item.explicit}`);
    logger.verbose(`Popularity: ${current.item.popularity}`);

    // fetch all playlists for caching and tagging
    if (options.refreshPlaylists) {
      await sortSong.refreshPlaylistTags();
    }

    if (options.sort) {
      await sortSong.sort(current.item, options);
    }

    // TODO: select from sieve playlists
    // TODO: add update tag prompts function
  }
};

// TODO: keep persistant logs of sorted songs?

start();
