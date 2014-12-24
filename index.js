/**
 * Commands Plugin for Unibot
 * @param  {Object} options [description]
 *   db: {mongoose} the mongodb connection
 *   bot: {irc} the irc bot
 *   web: {connect} a connect + connect-rest webserver
 *   config: {object}
 * @return {Function}         init function to access shared resources
 */
module.exports = function init(options){

  var mongoose = options.db;
  var bot = options.bot;
  var webserver = options.web;
  var config = options.config;

  var Logs = new mongoose.Schema({
    channel : {
      type  : String, // channel._id
      index : {
        unique   : true,
        dropDups : false
      }
    },
    logs : {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    }
  });

  var model = mongoose.model('Logs', Logs);

  webserver.get('/logs', function(req, res, next){
    res.sendFile(__dirname + '/index.html');
  });

  webserver.get('/logs/:channel', function(req, res, next) {
    model.findOne({ channel: req.params.channel }, function(err, logs){
      res.send(err || logs);
    });
  });

  return function plugin(channel){
    var logs = [];

    model.findOne({ channel: channel.id }, function(err, _logs_){
      if (err || !_logs_) {
        logs = new model({
          channel: channel.id
        });
        logs.save();
      } else {
        logs = _logs_;
      }
    });

    return {
      "(.+)": function(from, matches) {
        logs.logs.unshift({ from: from, message: matches[0], timestamp: Date.now() });
        logs.markModified('logs');
        logs.save();
      }
    };
  };
};