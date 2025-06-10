const { client } = require("./mqtt");
const { jsonNormalization } = require("./normalized");
const { setRedisData, getRedisData, deleteRedisData } = require("./redisCrud");
const { sendNormalizedJsonToAwsIotCore } = require("./sendiotcore");

const express = require("express");
const app = express();
const port = 5001;

app.use(express.json());

// mqtt connection
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

  //mqtt message sent to iotcore
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

//api to setData in redis server
app.post("/set-redis-data", async (req, res) => {
  const { key, data } = req.body;

  try {
    const result = await setRedisData(key, data);
    res.status(200).json({
      message: `JSON data for key "${key}" set successfully.`,
      redisResponse: result,
    });
  } catch (err) {
    console.log("Failed to set data in redis server!!");
    res
      .status(500)
      .json({ message: "Failed to set data in redis!!", error: err });
  }
});

// Api to get data by key
app.get("/get-redis-data/:key", async (req, res) => {
  const { key } = req.params;
  try {
    const result = await getRedisData(key);
    res.status(200).json({ message: "Successfully got data::", data: result });
  } catch (err) {
    console.log("Failed to get data from redis server!!");
    res
      .status(500)
      .json({ message: "Failed to get data in redis!!", error: err });
  }
});

//Api to delete data from Redis

app.delete("/delete-redis-data/:key", async (req, res) => {
  const { key } = req.params;
  try {
    const result = await deleteRedisData(key);
    res
      .status(200)
      .json({ message: "Successfully delete data::", data: result });
  } catch (err) {
    console.log("Failed to delete data from redis server!!");
    res
      .status(500)
      .json({ message: "Failed to delete data in redis!!", error: err });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
