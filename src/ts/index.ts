#!/usr/bin/env node
import { program } from "commander";
import * as sortSong from "./sort-song";
import * as sortPlaylist from "./sort-playlist";
import logger from "./logger";

// TODO: do auth

program
  .option("-v, --verbose", "Displays more information.") // TODO: implement these
  .option("-l, --level <level>", "The npm logging level to be displayed.");

// Adds subcommands from modules
sortPlaylist.addCommand(program);
sortSong.addCommand(program);

// TODO: misc tags
// TODO: add sieve origin playlist selection as command line option
// TODO: add verbose logging to display playlist overlaps?
// TODO: add interface for tag category editing.
// TODO: keep persistant logs of sorted songs?
// TODO: make fresh install setup easy for new users

program.parse(process.argv);
const options = program.opts();

if (options.verbose) {
  logger.level = "verbose";
}

// TODO: handle weird cases in ts
if (options.level) {
  logger.level = options.level;
}
