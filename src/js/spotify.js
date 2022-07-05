"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractId = exports.removeFromPlaylist = exports.addToPlaylist = exports.playlistIncludes = exports.getAllPlaylists = exports.getPlaylists = exports.artistsToString = exports.unlikeSong = exports.getTrackAudioFeatures = exports.overwritePlaylist = exports.getPlaylist = exports.getCurrentPlayback = exports.updateToken = exports.checkToken = void 0;
var axios = require("axios");
var fs = require("fs");
var inquirer = require("inquirer");
var DateTime = require("luxon").DateTime;
var auth = require("./spotify-auth");
var _a = require("../conf/tags.json"), ignoredTags = _a.ignoredTags, prompts = _a.prompts;
var logger_1 = __importDefault(require("./logger"));
var spotify = axios.create({ baseURL: "https://api.spotify.com/v1/" });
var _b = require("../conf/token.json"), access_token = _b.access_token, refresh_token = _b.refresh_token;
// TODO: separate calls into components and then pull together in import and reexport
/**
 * Checks the token on process startup.
 */
var checkToken = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(access_token == undefined)) return [3 /*break*/, 2];
                _a = exports.updateToken;
                return [4 /*yield*/, auth.setToken(refresh_token)];
            case 1:
                _a.apply(void 0, [_b.sent()]);
                _b.label = 2;
            case 2: return [2 /*return*/, exports.getCurrentPlayback()
                    .catch(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                // TODO: move this to an on unhandled rejection catchall
                                console.info("Access token expired, trying to refresh.");
                                _a = exports.updateToken;
                                return [4 /*yield*/, auth.refreshToken(refresh_token)];
                            case 1:
                                _a.apply(void 0, [_b.sent()]);
                                // FIXME: when this fails it logs the error despite the catch
                                return [2 /*return*/, exports.getCurrentPlayback()];
                        }
                    });
                }); })
                    .catch(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                console.info("Refresh failed, requesting new token.");
                                _a = exports.updateToken;
                                return [4 /*yield*/, auth.setToken()];
                            case 1:
                                _a.apply(void 0, [_b.sent()]);
                                return [2 /*return*/, exports.getCurrentPlayback()];
                        }
                    });
                }); })];
        }
    });
}); };
exports.checkToken = checkToken;
/**
 * Updates the cached token data in token.json
 * @param {*} data The access_token, refresh_token, and other token data.
 */
var updateToken = function (data) {
    data = __assign({ refresh_token: refresh_token }, data);
    access_token = data.access_token;
    fs.writeFile(__dirname + "/../conf/token.json", JSON.stringify(data, null, 2), function (err) {
        if (err) {
            throw err;
        }
        logger_1.default.info("token.json updated!");
    });
};
exports.updateToken = updateToken;
/**
 * Get information about the user’s current playback state, including track or episode, progress, and active device.
 */
var getCurrentPlayback = function () {
    return spotify.get("me/player/currently-playing", {
        params: {
            market: "from_token",
        },
        headers: { Authorization: "Bearer " + access_token },
    });
};
exports.getCurrentPlayback = getCurrentPlayback;
/**
 * Gets the given playlist
 * @param {*} playlistId
 * @returns
 */
var getPlaylist = function (playlistId, opts) {
    if (opts === void 0) { opts = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        var response, totalSongs, currentSongs, trackFields, offsetResponse, newTracks;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, spotify.get("playlists/" + playlistId, {
                        params: opts,
                        headers: { Authorization: "Bearer " + access_token },
                    })];
                case 1:
                    response = _d.sent();
                    totalSongs = response.data.tracks.total;
                    currentSongs = response.data.tracks.items.length;
                    trackFields = (_b = (_a = opts) === null || _a === void 0 ? void 0 : _a.fields) !== null && _b !== void 0 ? _b : "";
                    trackFields = (_c = trackFields.match(/tracks\((.*)\)/)) !== null && _c !== void 0 ? _c : [, ""];
                    trackFields = trackFields[1];
                    _d.label = 2;
                case 2:
                    if (!(currentSongs < totalSongs)) return [3 /*break*/, 4];
                    return [4 /*yield*/, spotify.get("playlists/" + playlistId + "/tracks", {
                            params: __assign(__assign({}, opts), { fields: trackFields, offset: currentSongs }),
                            headers: { Authorization: "Bearer " + access_token },
                        })];
                case 3:
                    offsetResponse = _d.sent();
                    newTracks = offsetResponse.data.items;
                    response.data.tracks.items = __spreadArray(__spreadArray([], response.data.tracks.items), newTracks);
                    // update currentSongs for eventual loop termination
                    currentSongs = response.data.tracks.items.length;
                    // update total song number to prevent potential race condition
                    totalSongs = offsetResponse.data.total;
                    return [3 /*break*/, 2];
                case 4: return [2 /*return*/, response];
            }
        });
    });
};
exports.getPlaylist = getPlaylist;
/**
 * Gets the given playlist
 * @param {*} playlistId
 * @returns
 */
var overwritePlaylist = function (playlistId, uris) { return __awaiter(void 0, void 0, void 0, function () {
    var snapshots, chunkSize, i, chunk, deleteSongs, chunkData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                snapshots = [];
                chunkSize = 100;
                i = 0;
                _a.label = 1;
            case 1:
                if (!(i < uris.length)) return [3 /*break*/, 5];
                chunk = uris.slice(i, i + chunkSize);
                deleteSongs = chunk.map(function (uri) {
                    return { uri: uri };
                });
                return [4 /*yield*/, spotify.delete("playlists/" + playlistId + "/tracks", {
                        data: {
                            tracks: deleteSongs,
                        },
                        headers: { Authorization: "Bearer " + access_token },
                    })];
            case 2:
                _a.sent();
                return [4 /*yield*/, spotify.post("playlists/" + playlistId + "/tracks", { uris: chunk }, {
                        headers: { Authorization: "Bearer " + access_token },
                    })];
            case 3:
                chunkData = (_a.sent()).data;
                snapshots.push(chunkData.snapshot_id);
                _a.label = 4;
            case 4:
                i += chunkSize;
                return [3 /*break*/, 1];
            case 5: return [2 /*return*/, snapshots];
        }
    });
}); };
exports.overwritePlaylist = overwritePlaylist;
/**
 * Get information about the user’s current playback state, including track or episode, progress, and active device.
 */
var getTrackAudioFeatures = function (trackIds) {
    if (typeof trackIds == "string") {
        return spotify.get("audio-features/" + trackIds, {
            headers: { Authorization: "Bearer " + access_token },
        });
    }
    else {
        var ids_1 = "";
        trackIds.forEach(function (trackId) {
            ids_1 += trackId + ",";
        });
        return spotify.get("audio-features", {
            headers: { Authorization: "Bearer " + access_token },
            params: { ids: ids_1 },
        });
    }
};
exports.getTrackAudioFeatures = getTrackAudioFeatures;
/**
 * Remove song from Liked Songs
 * @param {*} song
 */
var unlikeSong = function (song) {
    return spotify
        .delete("me/tracks", {
        params: {
            ids: song.id,
        },
        headers: { Authorization: "Bearer " + access_token },
    })
        .then(function () {
        logger_1.default.info("Track '" + song.name + "' by " + exports.artistsToString(song.artists) + " has been removed from Liked Songs.");
    });
};
exports.unlikeSong = unlikeSong;
var artistsToString = function (artists) {
    return artists.reduce(function (accumulator, artist, index, artists) {
        if (index === 0) {
            return artist.name;
        }
        else if (index === artists.length - 1) {
            return accumulator + ", and " + artist.name;
        }
        else {
            return accumulator + ", " + artist.name;
        }
    }, "");
};
exports.artistsToString = artistsToString;
/**
 * Gets 50 of the current users playlists.
 * @param {*} offset What index playlist to start fetching from.
 * @returns
 */
var getPlaylists = function (offset) {
    if (offset === void 0) { offset = 0; }
    return spotify.get("me/playlists", {
        params: { limit: 50, offset: offset },
        headers: { Authorization: "Bearer " + access_token },
    });
};
exports.getPlaylists = getPlaylists;
/**
 * Gets all of the current user's playlists.
 * @returns
 */
var getAllPlaylists = function () { return __awaiter(void 0, void 0, void 0, function () {
    var offset, data, allPlaylists;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                offset = 0;
                return [4 /*yield*/, exports.getPlaylists(offset)];
            case 1:
                data = (_a.sent()).data;
                allPlaylists = data.items;
                _a.label = 2;
            case 2:
                if (!(data.items.length > 0)) return [3 /*break*/, 4];
                offset += 50;
                return [4 /*yield*/, exports.getPlaylists(offset)];
            case 3:
                data = (_a.sent()).data;
                allPlaylists = allPlaylists.concat(data.items);
                return [3 /*break*/, 2];
            case 4: return [2 /*return*/, allPlaylists];
        }
    });
}); };
exports.getAllPlaylists = getAllPlaylists;
var playlistIncludes = function (playlist, song) {
    return spotify
        .get("playlists/" + playlist + "/tracks", {
        param: { market: "from_token" },
        headers: { Authorization: "Bearer " + access_token },
    })
        .then(function (_a) {
        var data = _a.data;
        var playlistIncludesSong = false;
        data.items.forEach(function (item) {
            if (item.track.uri === song) {
                playlistIncludesSong = true;
            }
        });
        return playlistIncludesSong;
    });
};
exports.playlistIncludes = playlistIncludes;
// TODO: in ts make this work for arrays
var addToPlaylist = function (playlist, song) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.playlistIncludes(playlist, song)];
            case 1:
                if (!(_a.sent())) {
                    return [2 /*return*/, spotify.post("playlists/" + playlist + "/tracks", {
                            uris: [song],
                        }, {
                            headers: { Authorization: "Bearer " + access_token },
                        })];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.addToPlaylist = addToPlaylist;
var removeFromPlaylist = function (playlistId, song) { return __awaiter(void 0, void 0, void 0, function () {
    var playlist;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.getPlaylist(playlistId)];
            case 1:
                playlist = (_a.sent()).data;
                return [4 /*yield*/, exports.playlistIncludes(playlistId, song.uri)];
            case 2:
                if (_a.sent()) {
                    return [2 /*return*/, spotify
                            .delete("playlists/" + playlistId + "/tracks", {
                            data: { tracks: [{ uri: song.uri }] },
                            headers: { Authorization: "Bearer " + access_token },
                        })
                            .then(function () {
                            logger_1.default.info("Track '" + song.name + "' by " + exports.artistsToString(song.artists) + " has been removed from " + playlist.name + ".");
                        })
                            .catch(function (err) {
                            logger_1.default.error("Error removing track '" + song.name + "' by " + exports.artistsToString(song.artists) + " from " + playlist.name + ".");
                            logger_1.default.error(err);
                        })];
                }
                else {
                    logger_1.default.info("Track '" + song.name + "' by " + exports.artistsToString(song.artists) + " is not in " + playlist.name + ".");
                }
                return [2 /*return*/];
        }
    });
}); };
exports.removeFromPlaylist = removeFromPlaylist;
var extractId = function (link) {
    // checks for URI formatted spotify links
    var regexURI = /spotify:[^:]*:(.*)/;
    var matchesURI = link.match(regexURI);
    if (matchesURI !== null) {
        return matchesURI[1];
    }
    // checks for URL formatted spotify links
    var regexURL = /https:\/\/open\.spotify\.com\/playlist\/([^?]*).*/;
    var matchesURL = link.match(regexURL);
    if (matchesURL !== null) {
        return matchesURL[1];
    }
    // if URI and URL fail, return the original link
    return link;
};
exports.extractId = extractId;
