const fs = require("fs");
import logger from "./logger";

const checkNodeVersion = () => {
  const semVerRegEx = /(\d*)\.(\d*)\.(\d*)/;
  let match = process.version.match(semVerRegEx);
  if (match === null) {
    throw new Error("Error detecting node version.");
  } else {
    let majorVersion = parseInt(match[1]);
    if (majorVersion < 14) {
      throw new Error("Please use node 14 or greater.");
    }
  }
};

const checkPKCE = () => {
  try {
    require("../conf/pkce");
  } catch (e) {
    logger.debug(e);
    let err = fs.writeFileSync(
      `${__dirname}/../conf/pkce.json`,
      JSON.stringify({})
    );
    if (err) {
      logger.error(err);
    } else {
      logger.debug("Created blank pkce.json file.");
    }
  }
};

const checkTags = () => {
  try {
    require("../conf/tags");
  } catch (e) {
    logger.debug(e);
    let err = fs.copyFileSync(
      `${__dirname}/../conf/example-tags.json`,
      `${__dirname}/../conf/tags.json`,
      fs.constants.COPYFILE_EXCL
    );
    if (err) {
      logger.error(err);
    } else {
      logger.debug("Created tags.json file from example-tags.json file.");
    }
  }
};

const checkPlaylists = () => {
  try {
    require("../conf/playlists");
  } catch (e) {
    logger.debug(e);
    let err = fs.writeFileSync(
      `${__dirname}/../conf/playlists.json`,
      JSON.stringify([])
    );
    if (err) {
      logger.error(err);
    } else {
      logger.debug("Created blank playlists.json file.");
    }
  }
};

const checkToken = () => {
  try {
    require("../conf/token");
  } catch (e) {
    logger.debug(e);
    let err = fs.writeFileSync(
      `${__dirname}/../conf/token.json`,
      JSON.stringify({})
    );
    if (err) {
      logger.error(err);
    } else {
      logger.debug("Created blank token.json file.");
    }
  }
};

export const checkConfs = async () => {
  checkNodeVersion();
  checkPKCE();
  checkTags();
  checkPlaylists();
  checkToken();
};
