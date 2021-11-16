const assert = require("chai").assert;
const playlistSort = require("../src/js/playlist-sort");

describe("playlist-sort module", () => {
  let levitating = {
    id: "Levitating",
    danceability: 69.5,
    energy: 88.4,
    popularity: 86,
    valence: 91.4,
  };

  let kissMeMore = {
    id: "Kiss Me More",
    danceability: 76.4,
    energy: 70.5,
    popularity: 87,
    valence: 78.1,
  };

  let animeSagaEnding = {
    id: "ANIME SAGA ENDING",
    danceability: 67.4,
    energy: 68.4,
    popularity: 40,
    valence: 22.8,
  };

  describe("trackDistance", () => {
    it("should find the distance between the same song to be 0.", () => {
      assert.strictEqual(playlistSort.trackDistance(levitating, levitating), 0);
    });
    it("should return a positive number for the distance between two tracks.", () => {
      assert.isAtLeast(playlistSort.trackDistance(levitating, kissMeMore), 0);
      assert.isAtLeast(
        playlistSort.trackDistance(levitating, animeSagaEnding),
        0
      );
      assert.isAtLeast(
        playlistSort.trackDistance(kissMeMore, animeSagaEnding),
        0
      );
    });
  });
});
