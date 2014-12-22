var mongoose  = require('mongoose');

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

var plugin = function(channel, config){
  var logs;

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

plugin.load = function(app) {
  app.get('/logs', function(req, res, next){
    res.sendFile('index.html');
  });
  app.get('/logs/:channel', function(req, res, next) {
    model.findOne({ channel: req.params.channel }, function(err, logs){
      res.send(err || logs);
    });
  });
};

module.exports = plugin;