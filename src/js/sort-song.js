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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sort = exports.suggestTagsForInclusion = exports.suggestTagsForExclusion = exports.tagSong = exports.refreshPlaylistTags = exports.importNewTags = exports.getPlaylistTags = exports.addCommand = void 0;
var axios = require("axios");
var fs = require("fs");
var inquirer = require("inquirer");
var DateTime = require("luxon").DateTime;
var spotify = __importStar(require("./spotify"));
var _a = require("../conf/tags.json"), ignoredTags = _a.ignoredTags, prompts = _a.prompts, sievePlaylist = _a.sievePlaylist;
var logger_1 = __importDefault(require("./logger"));
// TODO: add comprehensive JSDoc comments
// TODO: pull out any non-general Spotify API specific functions into sort-track module
// TODO: clean up all 'any' type declarations
// TODO: create 'SpotifyPlaylist' type
// TODO: create 'SpotifyTrack' type
// TODO: create 'SpotifyTag' type
var addCommand = function (program) {
    program
        .command("song")
        .description("sorts the given playlist")
        .option("-r, --refresh-playlists", "downloads all playlist tag info to playlists.json.")
        .option("-t --suggest-tags", "Suggest playlist tag changes based on the manual playlist selections.")
        .option("--no-sort", "Doesn't sort the currently playing song.")
        .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
        var current, artistString;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, spotify.checkToken()];
                case 1:
                    current = (_a.sent()).data;
                    if (!(current == "")) return [3 /*break*/, 2];
                    logger_1.default.warn("Please listen to a song to sort.");
                    return [3 /*break*/, 6];
                case 2:
                    artistString = spotify.artistsToString(current.item.artists);
                    logger_1.default.info("Currently listening to '" + current.item.name + "' by " + artistString + ".");
                    logger_1.default.verbose("Release Date: " + current.item.album.release_date);
                    logger_1.default.verbose("Explicit: " + current.item.explicit);
                    logger_1.default.verbose("Popularity: " + current.item.popularity);
                    if (!options.refreshPlaylists) return [3 /*break*/, 4];
                    return [4 /*yield*/, exports.refreshPlaylistTags()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    if (!options.sort) return [3 /*break*/, 6];
                    return [4 /*yield*/, exports.sort(current.item, options)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); });
};
exports.addCommand = addCommand;
var getPlaylistTags = function () { return __awaiter(void 0, void 0, void 0, function () {
    var tagMap, taggedPlaylists, playlists, newTags;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tagMap = new Map();
                taggedPlaylists = [];
                return [4 /*yield*/, spotify.getAllPlaylists()];
            case 1:
                playlists = _a.sent();
                newTags = [];
                // compiles a list of current cached tags
                prompts.forEach(function (prompt) {
                    prompt.choices.forEach(function (tag) {
                        tagMap.set(tag, []);
                    });
                });
                ignoredTags.forEach(function (tag) {
                    tagMap.set(tag, []);
                });
                playlists.forEach(function (playlist) {
                    if (playlist.description != undefined && playlist.description != "") {
                        var tags = playlist.description.split("#");
                        var mandatoryTags_1 = [];
                        var optionalTags_1 = [];
                        var excludeTags_1 = [];
                        tags.shift();
                        tags.forEach(function (tag) {
                            var name = playlist.name;
                            tag = tag.trim();
                            if (tag[0] == "?") {
                                tag = tag.substring(1);
                                optionalTags_1.push(tag);
                                name = "?" + name;
                            }
                            else if (tag[0] == "!") {
                                tag = tag.substring(1);
                                excludeTags_1.push(tag);
                                name = "!" + name;
                            }
                            else {
                                mandatoryTags_1.push(tag);
                            }
                            if (tagMap.has(tag)) {
                                tagMap.set(tag, tagMap.get(tag).concat([name]));
                            }
                            else {
                                logger_1.default.info("New tag \"" + tag + "\" detected in playlist " + playlist.name + ".");
                                newTags.push(tag);
                                tagMap.set(tag, [name]);
                            }
                        });
                        if (mandatoryTags_1.length !== 0 ||
                            optionalTags_1.length !== 0 ||
                            excludeTags_1.length != 0) {
                            taggedPlaylists.push({
                                name: playlist.name,
                                uri: playlist.uri,
                                mandatoryTags: mandatoryTags_1,
                                optionalTags: optionalTags_1,
                                excludeTags: excludeTags_1,
                            });
                        }
                    }
                });
                if (!(newTags.length > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, exports.importNewTags(newTags)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/, {
                    taggedPlaylists: taggedPlaylists,
                    tagMap: tagMap,
                }];
        }
    });
}); };
exports.getPlaylistTags = getPlaylistTags;
var importNewTags = function (newTags) { return __awaiter(void 0, void 0, void 0, function () {
    var tagPrompts, categories;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tagPrompts = [];
                categories = [];
                prompts.forEach(function (prompt, index) {
                    categories.push({ name: prompt.name, value: index });
                });
                categories.push({ name: "ignored (not recommended)", value: -1 });
                categories.push({ name: "skip", value: -2 });
                newTags.forEach(function (newTag) {
                    tagPrompts.push({
                        name: newTag,
                        type: "list",
                        message: "New tag \"" + newTag + "\" detected. How do you want to categorize the new tag?\"",
                        choices: categories,
                    });
                });
                return [4 /*yield*/, inquirer.prompt(tagPrompts).then(function (answers) {
                        for (var tag in answers) {
                            var index = answers[tag];
                            if (index === -1) {
                                ignoredTags.push(tag);
                            }
                            else if (index !== -2) {
                                prompts[index].choices.push(tag);
                            }
                        }
                        // sorts tags in a category alphabetically
                        ignoredTags.sort();
                        prompts.forEach(function (prompt) {
                            prompt.choices.sort();
                        });
                        // updates the tag json
                        fs.writeFile(__dirname + "/../conf/tags.json", JSON.stringify({ prompts: prompts, ignoredTags: ignoredTags }, null, 2), function (err) {
                            if (err)
                                throw err;
                            logger_1.default.info("tags updated!");
                        });
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.importNewTags = importNewTags;
var refreshPlaylistTags = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, taggedPlaylists, tagMap;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                logger_1.default.info("Downloading playlists with tag information...");
                return [4 /*yield*/, exports.getPlaylistTags()];
            case 1:
                _a = _b.sent(), taggedPlaylists = _a.taggedPlaylists, tagMap = _a.tagMap;
                logger_1.default.verbose(taggedPlaylists);
                logger_1.default.verbose(tagMap);
                fs.writeFileSync(__dirname + "/../conf/playlists.json", JSON.stringify(taggedPlaylists, null, 2));
                logger_1.default.info("playlists.json updated!");
                return [2 /*return*/];
        }
    });
}); };
exports.refreshPlaylistTags = refreshPlaylistTags;
var tagSong = function (song) { return __awaiter(void 0, void 0, void 0, function () {
    var tags, release;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tags = [];
                if (!song.explicit) {
                    tags.push("clean");
                }
                if (song.popularity > 90) {
                    tags.push("trendy");
                }
                release = DateTime.fromISO(song.album.release_date);
                if (release < DateTime.fromISO("1940")) {
                    tags.push("oldies");
                }
                else if (release < DateTime.fromISO("1950")) {
                    tags.push("40s");
                }
                else if (release < DateTime.fromISO("1960")) {
                    tags.push("50s");
                }
                else if (release < DateTime.fromISO("1970")) {
                    tags.push("60s");
                }
                else if (release < DateTime.fromISO("1980")) {
                    tags.push("70s");
                }
                else if (release < DateTime.fromISO("1990")) {
                    tags.push("80s");
                }
                else if (release < DateTime.fromISO("2000")) {
                    tags.push("90s");
                }
                else if (release < DateTime.fromISO("2010")) {
                    tags.push("00s");
                }
                else if (release < DateTime.fromISO("2020")) {
                    tags.push("10s");
                }
                else {
                    tags.push("20s");
                }
                // ask tag questions from prompts.json
                return [4 /*yield*/, inquirer.prompt(prompts).then(function (answers) {
                        logger_1.default.verbose("Tags from prompts:");
                        logger_1.default.verbose(answers);
                        for (var answer in answers) {
                            tags = tags.concat(answers[answer]);
                        }
                    })];
            case 1:
                // ask tag questions from prompts.json
                _a.sent();
                return [2 /*return*/, tags];
        }
    });
}); };
exports.tagSong = tagSong;
var suggestTagsForExclusion = function (playlist, tags) {
    // find potential negative tags for exclusion
    var potentialExcludeTags = tags.filter(function (tag) {
        return !playlist.mandatoryTags.includes(tag);
    });
    potentialExcludeTags = potentialExcludeTags.filter(function (tag) {
        return !playlist.optionalTags.includes(tag);
    });
    // finds optional tags not included for potential mandatory tagging
    var potentialMandatoryTags = playlist.optionalTags.filter(function (tag) {
        return !tags.includes(tag);
    });
    logger_1.default.info("Consider adding one or more of the following tags to the playlist '" + playlist.name + "' to prevent it from being incorrectly suggested for similar songs:");
    potentialExcludeTags.forEach(function (tag) {
        logger_1.default.info("#!" + tag);
    });
    potentialMandatoryTags.forEach(function (tag) {
        logger_1.default.info("#?" + tag + " -> #" + tag);
    });
    // TODO: add a heatmap for tags?
    // TODO: use heatmap to suggest new mandatory tags to require based on previous patterns
};
exports.suggestTagsForExclusion = suggestTagsForExclusion;
var suggestTagsForInclusion = function (playlist, tags) {
    // TODO: to exclude a playlist
    // TODO: add a mandatory tag
    // TODO: add a excludeTag
    // TODO: to include a playlist
    // TODO: add an include tag
    // TODO: change an include to an optional
    // TODO: remove an exclude
};
exports.suggestTagsForInclusion = suggestTagsForInclusion;
var sort = function (song, options) { return __awaiter(void 0, void 0, void 0, function () {
    var allPlaylists, tags, playlists, correctPlaylists, playlistChoices, moveSong, movePromises_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                allPlaylists = require("../conf/playlists.json");
                if (allPlaylists.length === 0) {
                    exports.refreshPlaylistTags();
                    allPlaylists = require("../conf/playlists.json");
                }
                return [4 /*yield*/, exports.tagSong(song)];
            case 1:
                tags = _a.sent();
                logger_1.default.verbose("All tags:");
                logger_1.default.verbose(tags);
                playlists = allPlaylists.filter(function (playlist) {
                    var hasAll = playlist.mandatoryTags.every(function (tag) { return tags.includes(tag); });
                    var hasAtLeastOne = true;
                    if (playlist.optionalTags.length > 0) {
                        hasAtLeastOne = playlist.optionalTags.some(function (tag) {
                            return tags.includes(tag);
                        });
                    }
                    var hasNone = !playlist.excludeTags.some(function (tag) { return tags.includes(tag); });
                    if (hasAll && hasAtLeastOne && hasNone) {
                        return playlist;
                    }
                });
                playlists.forEach(function (playlist) {
                    logger_1.default.info(playlist.name);
                });
                return [4 /*yield*/, inquirer.prompt({
                        name: "correctPlaylists",
                        type: "confirm",
                        message: "Are these playlists correct",
                    })];
            case 2:
                correctPlaylists = (_a.sent()).correctPlaylists;
                if (!!correctPlaylists) return [3 /*break*/, 4];
                playlistChoices = allPlaylists.map(function (playlist) {
                    return {
                        name: playlist.name,
                        value: playlist,
                        checked: playlists.some(function (selectedPlaylist) {
                            return selectedPlaylist.name == playlist.name;
                        }),
                    };
                });
                return [4 /*yield*/, inquirer
                        .prompt({
                        name: "manualPlaylists",
                        type: "checkbox",
                        message: "Select the correct playlists",
                        choices: playlistChoices,
                    })
                        .then(function (_a) {
                        var manualPlaylists = _a.manualPlaylists;
                        if (options.suggestTags) {
                            // Lists playlists removed from tag based suggestions
                            var removedPlaylists = playlists.filter(function (playlist) {
                                return !manualPlaylists.includes(playlist);
                            });
                            removedPlaylists.forEach(function (removedPlaylist) {
                                exports.suggestTagsForExclusion(removedPlaylist, tags);
                            });
                            // Lists playlists added to tag based suggestions
                            var addedPlaylists = manualPlaylists.filter(function (manualPlaylist) {
                                return !playlists.includes(manualPlaylist);
                            });
                            addedPlaylists.forEach(function (addedPlaylist) {
                                exports.suggestTagsForExclusion(addedPlaylist, tags);
                            });
                        }
                        return manualPlaylists;
                    })];
            case 3:
                // TODO: custom searchable prompt
                playlists = _a.sent();
                _a.label = 4;
            case 4: return [4 /*yield*/, inquirer
                    .prompt({
                    name: "moveSong",
                    type: "confirm",
                    message: "Do you want to move '" + song.name + "' to the selected playlists?",
                })
                    .then(function (_a) {
                    var moveSong = _a.moveSong;
                    return moveSong;
                })];
            case 5:
                moveSong = _a.sent();
                if (moveSong) {
                    movePromises_1 = [];
                    playlists.forEach(function (playlist) {
                        movePromises_1.push(spotify
                            .addToPlaylist(playlist.uri.split(":")[2], song.uri)
                            .then(function (res) {
                            // TODO: put this in the function?
                            if (res == undefined) {
                                logger_1.default.info("'" + song.name + "' is already in " + playlist.name + ".");
                            }
                            else {
                                logger_1.default.info("'" + song.name + "' has been successfully moved to " + playlist.name + ".");
                            }
                        })
                            .catch(function (err) {
                            logger_1.default.error("Error moving '" + song.name + "' to " + playlist.name + ".");
                            logger_1.default.error(err);
                        }));
                    });
                    Promise.all(movePromises_1).then(function () {
                        if (sievePlaylist === "Liked Songs") {
                            spotify.unlikeSong(song);
                        }
                        else if (sievePlaylist != undefined) {
                            spotify.removeFromPlaylist(sievePlaylist, song);
                        }
                        else {
                            logger_1.default.verbose("No sieve playlist configured.");
                        }
                    });
                }
                return [2 /*return*/, playlists];
        }
    });
}); };
exports.sort = sort;
