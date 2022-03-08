#!/usr/bin/env node
import { checkConfs } from "./setup";
checkConfs();
import { program } from "commander";
import * as sortSong from "./sort-song";
import * as sortPlaylist from "./sort-playlist";
import logger from "./logger";

program
  .option("-v, --verbose", "Displays more information.") // TODO: implement these
  .option("-l, --level <level>", "The npm logging level to be displayed.");

// Adds subcommands from modules
sortPlaylist.addCommand(program);
sortSong.addCommand(program);

// TODO: misc tags - create a additional prompt/section for uncategorized tags
// TODO: add verbose logging to display playlist overlaps?
// TODO: add interface for tag category editing.
// TODO: keep persistant logs of sorted songs? - use a second logger to record all playlist adds and subtracts?
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
