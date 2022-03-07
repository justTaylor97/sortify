#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var sortSong = __importStar(require("./sort-song"));
var sortPlaylist = __importStar(require("./sort-playlist"));
var logger_1 = __importDefault(require("./logger"));
// TODO: do auth
commander_1.program
    .option("-v, --verbose", "Displays more information.") // TODO: implement these
    .option("-l, --level <level>", "The npm logging level to be displayed.");
// Adds subcommands from modules
sortPlaylist.addCommand(commander_1.program);
sortSong.addCommand(commander_1.program);
// TODO: misc tags
// TODO: add sieve origin playlist selection as command line option
// TODO: add verbose logging to display playlist overlaps?
// TODO: add interface for tag category editing.
// TODO: keep persistant logs of sorted songs?
// TODO: make fresh install setup easy for new users
commander_1.program.parse(process.argv);
var options = commander_1.program.opts();
if (options.verbose) {
    logger_1.default.level = "verbose";
}
// TODO: handle weird cases in ts
if (options.level) {
    logger_1.default.level = options.level;
}
