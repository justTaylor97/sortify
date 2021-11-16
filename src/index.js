#!/usr/bin/env node
const fs = require("fs");
const { program } = require("commander");
const spotify = require("./spotify");
const logger = require("./logger");

program
  .option(
    "-r, --refresh-playlists",
    "downloads all playlist tag info to playlists.json."
  )
  .option("-v, --verbose", "Displays more information.") // TODO: implement these
  .option("--no-sort", "doesn't sort the currently playing song.")
  .option("-h, --help", "display help for command")
  .option("-l, --level <level>", "The npm logging level to be displayed.");

// TODO: add option to add tag to bucket
// TODO: misc tags

program.parse(process.argv);
const options = program.opts();

if (options.verbose) {
  logger.level = "verbose";
}

// TODO: handle weird cases in ts
if (options.level) {
  logger.level = level;
}

const start = async () => {
  let { data: current } = await spotify.checkToken();
  if (current == "") {
    logger.warn("Please listen to a song to sort.");
  } else {
    let artistString = spotify.artistsToString(current.item.artists);
    logger.info(
      `Currently listening to '${current.item.name}' by ${artistString}.`
    );

    logger.verbose(`Release Date: ${current.item.album.release_date}`);
    logger.verbose("Explicit:", current.item.explicit);
    logger.verbose("Popularity:", current.item.popularity);

    // fetch all playlists for caching and tagging
    if (options.refreshPlaylists) {
      await spotify.refreshPlaylistTags();
    }

    if (options.sort) {
      await spotify.sort(current.item);
    }

    // TODO: select from sieve playlists
    // TODO: add update tag prompts function
  }
};

start();
