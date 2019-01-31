let Pusher = require("pusher");

module.exports = {
  pusher: function() {
    let pusher = new Pusher({
      appId: "702485",
      key: "c6ecf9f5f543d9e5c82d",
      secret: "8ef8b7286a6ef3a93f87",
      cluster: "us2",
      encrypted: true
    });

    pusher.trigger("my-channel", "my-event", {
      message: "hello world"
    });
  }
};
