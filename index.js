const { client } = require("./mqtt");
const { jsonNormalization } = require("./normalized");
const { sendNormalizedJsonToAwsIotCore } = require("./sendiotcore");

const mqttTrigger = () => {
  client.on("connect", () => {
    console.log("Connected to MQTT!");
    client.subscribe(`#`, (err) => {
      if (err) {
        console.error("Error in subscribing to topic:", err);
      } else {
        console.log("Subscribed to the topic");
      }
    });
  });

  client.on("message", async (topic, message) => {
    try {
      if (message) {
        setTimeout(() => {
          console.log("message:::::", message.toString());
        }, 5000);

        let normalizedJSON = await jsonNormalization(message.toString());

        if (normalizedJSON !== "INVALID_JSON") {
          //function to send data on iot core
          let iotcoredata = await sendNormalizedJsonToAwsIotCore(
            normalizedJSON
          );
        }
      }
    } catch (err) {
      console.error("Error processing MQTT message:", err);
    }
  });
};

mqttTrigger();
