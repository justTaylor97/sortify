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
exports.modulateTrack = exports.trackDistance = exports.addCommand = void 0;
var spotify = __importStar(require("./spotify"));
var fs_1 = __importDefault(require("fs"));
var dice = require("@amnesic0blex/dice");
var addCommand = function (program) {
    program
        .command("playlist <playlistId>")
        .description("sorts the given playlist")
        .action(function (playlistId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, spotify.checkToken()];
                case 1:
                    _a.sent();
                    sort(playlistId);
                    return [2 /*return*/];
            }
        });
    }); });
};
exports.addCommand = addCommand;
/**
 * Measures the distance between two Spotify tracks. The distance is calculated from the track's danceability, energy, popularity, and valence.
 * @param a The first Spotify track.
 * @param b The second Spotify track.
 * @returns The distance between the two tracks.
 */
var trackDistance = function (a, b) {
    var distance = Math.pow(a.danceability - b.danceability, 2);
    distance += Math.pow(a.energy - b.energy, 2);
    distance += Math.pow(a.popularity - b.popularity, 2);
    distance += Math.pow(a.valence - b.valence, 2);
    distance += Math.pow(a.tempo - b.tempo, 2);
    distance = Math.pow(distance, 0.5);
    return distance;
};
exports.trackDistance = trackDistance;
/**
 * Measures the distance between two Spotify tracks. The distance is calculated from the track's danceability, energy, popularity, and valence.
 * @param a The first Spotify track.
 * @param b The second Spotify track.
 * @returns The distance between the two tracks.
 */
var modulateTrack = function (track, field, direction) {
    if (field == undefined) {
        var randomFieldIndex = dice.randInt(0, 4);
        switch (randomFieldIndex) {
            case 0:
                field = "danceability";
                break;
            case 1:
                field = "energy";
                break;
            case 2:
                field = "popularity";
                break;
            case 3:
                field = "valence";
                break;
            case 4:
                field = "tempo";
                break;
            default:
                field = "tempo";
                break;
        }
    }
    if (direction == undefined) {
        var randomDirectionIndex = dice.randInt(0, 1);
        switch (randomDirectionIndex) {
            case 0:
                direction = "positive";
                break;
            case 1:
                direction = "negative";
                break;
            default:
                direction = "positive";
        }
    }
    if (direction == "positive") {
        track[field] += 20;
    }
    else if (direction == "negative") {
        track[field] -= 20;
    }
    return track;
};
exports.modulateTrack = modulateTrack;
// TODO: add function to return/log vital stats
var sort = function (playlistId) { return __awaiter(void 0, void 0, void 0, function () {
    var data, playlistTracks, ids, audio_features, detailedTracks, i, orderedPlaylist, anchorTrack, closestTrack, i, currentTrackDistance, nextTrack, csvWriter, uris;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, spotify.getPlaylist(playlistId, {
                    fields: "tracks.items(track(id, uri, name, popularity, explicit, duration_ms, artists(name,id)))",
                })];
            case 1:
                data = (_a.sent()).data;
                playlistTracks = data.tracks.items;
                playlistTracks = playlistTracks.map(function (currentTrack) {
                    return currentTrack.track;
                });
                ids = playlistTracks.map(function (currentTrack) {
                    return currentTrack.id;
                });
                return [4 /*yield*/, spotify.getTrackAudioFeatures(ids)];
            case 2:
                audio_features = (_a.sent()).data.audio_features;
                detailedTracks = [];
                for (i = 0; i < playlistTracks.length; ++i) {
                    // scale certain fields for better manipulation
                    audio_features[i].danceability *= 100;
                    audio_features[i].energy *= 100;
                    audio_features[i].valence *= 100;
                    detailedTracks.push(__assign(__assign({}, playlistTracks[i]), audio_features[i]));
                }
                orderedPlaylist = [];
                orderedPlaylist.push(detailedTracks.shift());
                while (detailedTracks.length > 0) {
                    anchorTrack = orderedPlaylist[orderedPlaylist.length - 1];
                    anchorTrack = exports.modulateTrack(anchorTrack);
                    closestTrack = {
                        trackIndex: 0,
                        distance: exports.trackDistance(anchorTrack, detailedTracks[0]),
                    };
                    for (i = 1; i < detailedTracks.length; ++i) {
                        currentTrackDistance = exports.trackDistance(anchorTrack, detailedTracks[i]);
                        if (currentTrackDistance < closestTrack.distance) {
                            closestTrack = {
                                trackIndex: i,
                                distance: currentTrackDistance,
                            };
                        }
                    }
                    nextTrack = detailedTracks.splice(closestTrack.trackIndex, 1);
                    orderedPlaylist = orderedPlaylist.concat(nextTrack);
                    console.log(anchorTrack.name + " is closest to " + nextTrack[0].name + " with a distance of " + closestTrack.distance + " and BPM " + nextTrack[0].tempo);
                }
                csvWriter = fs_1.default.createWriteStream("./output.csv");
                csvWriter.write("NAME|Danceability|Energy|Popularity|Valence|Tempo\n");
                orderedPlaylist.forEach(function (track) {
                    csvWriter.write(track.name + "|" + track.danceability + "|" + track.energy + "|" + track.popularity + "|" + track.valence + "|" + track.tempo + "\n");
                });
                uris = orderedPlaylist.map(function (track) {
                    return track.uri;
                });
                spotify.overwritePlaylist(playlistId, uris);
                return [2 /*return*/];
        }
    });
}); };
// TODO: smart modulation
// every 20 minutes or so play something popular
// follow popular songs by unpopular songs
// take popularity out of distance?
// TODO: artist deduper
// TODO: from the playlist get all songs and audio stuff to store in a big thing
// TODO: iterate over them to create different movements
//   let { data } = await spotify.getCurrentPlayback();
//   let song = data.item;
// TODO: playlist sorting options?
// TODO: danceability
// TODO: energy
// TODO: loudness
// TODO: valence (Upbeat/downbeat)
// TODO: tempo
// TODO: popularity
// TODO: duration
// TODO: acousticness
// TODO: instrumentalness
// TODO: speechiness
// TODO: future stuff
// TODO: mode
// TODO: liveness
