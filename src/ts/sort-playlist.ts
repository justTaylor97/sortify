import * as spotify from "./spotify";
import fs from "fs";
import logger from "./logger";
const dice = require("@amnesic0blex/dice");

type TrackAudioFeatures = {
  id: string;
  danceability: number;
  energy: number;
  popularity: number;
  valence: number;
  tempo: number;
  key: number;
};

export const addCommand = (program: any) => {
  program
    .command("playlist <playlistId>")
    .description("sorts the given playlist")
    .action(async (playlistId: string) => {
      await spotify.checkToken();
      sort(playlistId);
    });
};

/**
 * Measures the distance between two Spotify tracks. The distance is calculated from the track's danceability, energy, popularity, and valence.
 * @param a The first Spotify track.
 * @param b The second Spotify track.
 * @returns The distance between the two tracks.
 */
export const trackDistance = (
  a: TrackAudioFeatures,
  b: TrackAudioFeatures
): number => {
  let distance = Math.pow(a.danceability - b.danceability, 2);
  distance += Math.pow(a.energy - b.energy, 2);
  distance += Math.pow(a.popularity - b.popularity, 2);
  distance += Math.pow(a.valence - b.valence, 2);
  distance += Math.pow(a.tempo - b.tempo, 2);
  distance = Math.pow(distance, 0.5);
  return distance;
};

/**
 * Measures the distance between two Spotify tracks. The distance is calculated from the track's danceability, energy, popularity, and valence.
 * @param a The first Spotify track.
 * @param b The second Spotify track.
 * @returns The distance between the two tracks.
 */
export const modulateTrack = (
  track: TrackAudioFeatures,
  field?: "danceability" | "energy" | "popularity" | "valence" | "tempo",
  direction?: "positive" | "negative"
): TrackAudioFeatures => {
  if (field == undefined) {
    let randomFieldIndex = dice.randInt(0, 4);
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
    let randomDirectionIndex = dice.randInt(0, 1);
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
  } else if (direction == "negative") {
    track[field] -= 20;
  }

  return track;
};

// TODO: add function to return/log vital stats

const sort = async (playlistId: string) => {
  // TODO: handle regex for playlistId

  // fetches the playlist tracks and filters out irrelevant fields
  let { data } = await spotify.getPlaylist(playlistId, {
    fields:
      "tracks(total, offset, limit, items(track(id, uri, name, popularity, explicit, duration_ms, artists(name,id))))",
  });
  let playlistTracks = data.tracks.items;
  playlistTracks = playlistTracks.map((currentTrack: any) => {
    return currentTrack.track;
  });

  // fetches the audio features for all the tracks in the array
  let ids = playlistTracks.map((currentTrack: any) => {
    return currentTrack.id;
  });

  // splits tracks into chunks of 100 or less for API limits
  let audio_features: any[] = [];
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    let { data: chunkData } = await spotify.getTrackAudioFeatures(chunk);
    audio_features = audio_features.concat(chunkData.audio_features);
  }

  // merges the data from the tracks and the audio features into a detailed track array
  let detailedTracks = [];
  for (let i = 0; i < playlistTracks.length; ++i) {
    // scale certain fields for better manipulation
    audio_features[i].danceability *= 100;
    audio_features[i].energy *= 100;
    audio_features[i].valence *= 100;
    detailedTracks.push({ ...playlistTracks[i], ...audio_features[i] });
  }

  // TODO: Add variable anchor calculation
  let orderedPlaylist = [];
  orderedPlaylist.push(detailedTracks.shift());

  while (detailedTracks.length > 0) {
    let anchorTrack = orderedPlaylist[orderedPlaylist.length - 1];
    anchorTrack = modulateTrack(anchorTrack);
    let closestTrack = {
      trackIndex: 0,
      distance: trackDistance(anchorTrack, detailedTracks[0]),
    };

    for (let i = 1; i < detailedTracks.length; ++i) {
      let currentTrackDistance = trackDistance(anchorTrack, detailedTracks[i]);
      if (currentTrackDistance < closestTrack.distance) {
        closestTrack = {
          trackIndex: i,
          distance: currentTrackDistance,
        };
      }
    }
    let nextTrack: any = detailedTracks.splice(closestTrack.trackIndex, 1);
    orderedPlaylist = orderedPlaylist.concat(nextTrack);
    logger.info(`${anchorTrack.name} is closest to ${nextTrack[0].name}`);
    logger.verbose(`Distance: ${closestTrack.distance}`);
    logger.verbose(`BPM: ${nextTrack[0].tempo}`);
  }

  // TODO: write this to a csv for visual analysis?
  var csvWriter = fs.createWriteStream("./output.csv");
  csvWriter.write(`NAME|Danceability|Energy|Popularity|Valence|Tempo\n`);
  orderedPlaylist.forEach((track) => {
    csvWriter.write(
      `${track.name}|${track.danceability}|${track.energy}|${track.popularity}|${track.valence}|${track.tempo}\n`
    );
  });

  // TODO: add a confirm before update

  // updates the playlist with the sorted tracks
  let uris = orderedPlaylist.map((track) => {
    return track.uri;
  });
  await spotify.overwritePlaylist(playlistId, uris);
  logger.info("Playlist updated!");

  // TODO: increase
};

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
