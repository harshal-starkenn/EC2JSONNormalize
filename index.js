const { client } = require("./mqtt");
const { jsonNormalization } = require("./normalized");
const { normalizedJSON2 } = require("./normalizedJSON2");
const { setRedisData, getRedisData, deleteRedisData } = require("./redisCrud");
const { sendNormalizedJsonToAwsIotCore } = require("./sendiotcore");
const express = require("express");
const { createServer } = require("https");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const { normalizedJSON3 } = require("./normalizeJSON3");

// Initialize Express app
const app = express();
const port = 5001;
app.use(cors());
app.use(express.json());

const httpServer = createServer(
  {
    key: fs.readFileSync("./privkey.pem", "utf8"),
    cert: fs.readFileSync("./cert.pem", "utf8"),
    ca: fs.readFileSync("./chain.pem", "utf8"),
    requestCert: false,
    rejectUnauthorized: false,
  },
  app
);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

///////////////////// Mqttt-- Connection//////////////////////////////////
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
  }); //////////////////////  Mqtt message sent to iotcore ///////////////////////////// // Event listener for incoming MQTT messages

  client.on("message", async (topic, message) => {
    try {
      if (message) {
        setTimeout(() => {
          // console.log("message:::::", message.toString());
        }, 5000);
        let mqttmsg = JSON.parse(message.toString());
        let normalizedJSON; // Check message version for different normalization protocols
        if (mqttmsg?.ver === "JSON_2.0") {
          // Normalize using protocol 2.0
          normalizedJSON = await normalizedJSON2(mqttmsg);

          const eventName = JSON.parse(normalizedJSON).HMI_ID;

          io.timeout(5000).emit(eventName, normalizedJSON, (err, responses) => {
            if (err) {
              // some clients did not acknowledge the event in the given delay
              console.error(
                `Emit to event '${eventName}' timed out or failed.`
              );
            } else {
              // all clients responded with an acknowledgment
              console.log(`Successfully emitted data on event '${eventName}'.`);
            }
          });

          await sendNormalizedJsonToAwsIotCore(normalizedJSON);
        } else if (mqttmsg?.ver === "MSIL_DMS") {
          // Normalize using protocol 3.0 MSIL JSON
          normalizedJSON = await normalizedJSON3(mqttmsg);

          const eventName = JSON.parse(normalizedJSON).HMI_ID;

          io.timeout(5000).emit(eventName, normalizedJSON, (err, responses) => {
            if (err) {
              // some clients did not acknowledge the event in the given delay
              console.error(
                `Emit to event '${eventName}' timed out or failed.`
              );
            } else {
              // all clients responded with an acknowledgment
              console.log(`Successfully emitted data on event '${eventName}'.`);
            }
          });

          await sendNormalizedJsonToAwsIotCore(normalizedJSON);
        } else {
          // Protocol document 1 message normalization
          normalizedJSON = await jsonNormalization(mqttmsg);
          const eventName = JSON.parse(normalizedJSON).HMI_ID;

          io.timeout(5000).emit(eventName, normalizedJSON, (err, responses) => {
            if (err) {
              // some clients did not acknowledge the event in the given delay
              console.error(
                `Emit to event '${eventName}' timed out or failed.`
              );
            } else {
              // all clients responded with an acknowledgment
              console.log(`Successfully emitted data on event '${eventName}'.`);
            }
          });
          await sendNormalizedJsonToAwsIotCore(normalizedJSON);
        }
      }
    } catch (err) {
      console.error("Error processing MQTT message:", err);
    }
  });
};

mqttTrigger(); // Initialize MQTT connection and listeners

//////////////////////// Api to setData in redis server /////////////////////////////////
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

// Api to get data by key from Redis
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

// Api to delete data from Redis by key
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

// Start the server and listen for incoming requests
httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
