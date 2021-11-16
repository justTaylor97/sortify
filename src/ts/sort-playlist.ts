type TrackAudioFeatures = {
  id: string;
  danceability: number;
  energy: number;
  popularity: number;
  valence: number;
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
  distance = Math.pow(distance, 0.5);
  return distance;
};
