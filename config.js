config = {};

config.server = {
  address: "0.0.0.0",
  port: 8084
};

config.mongodb = {
  address: "mongodb://localhost/inspire"
}

config.feedstore = {
  ignore_content_type : true
};

config.pubsubhubbub = {
  callback_url_root : "http://inspire.ruudbijnen.nl",
  callback_url_path : "/callback/",
  verify_mode: "sync"
};

config.debug = false;

module.exports = config;