#!/usr/bin/env node
const fs = require("fs");
const { program } = require("commander");
const spotify = require("./spotify");

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
  let { data: current } = await spotify.getCurrentPlayback();

  let artistString = spotify.artistsToString(current.item.artists);
  console.log(
    `Currently listening to '${current.item.name}' by ${artistString}.`
  );

  console.log("Release Date:", current.item.album.release_date);
  console.log("Explicit:", current.item.explicit);
  console.log("Popularity:", current.item.popularity);

  // fetch all playlists for caching and tagging
  if (options.refreshPlaylists) {
    await spotify.refreshPlaylistTags();
  }

  if (options.sort) {
    let tags = await spotify.sort(current.item);
    console.log(tags);
  }

  // addToPlaylist(access_token, playlistID, current.item.uri);
  //
  // TODO: confirm or manually add and remove playlists.
};

start();
