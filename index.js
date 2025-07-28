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

// Initialize Express app
const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

// const server = http.createServer(app);\
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

/////////////////SOCKET -- Connection//////////////////////////////
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("joinTopic", (topic) => {
    socket.join(topic);
    console.log(`User ${socket.id} joined topic: ${topic}`);
    socket.emit("joinedTopicConfirmation", `You have joined topic: ${topic}`);
  });

  socket.on("publishToTopic", ({ topic, message }) => {
    if (!topic || !message) {
      console.warn(`Invalid 'publishToTopic' payload from ${socket.id}:`, {
        topic,
        message,
      });
      return;
    }
    console.log(
      `Message received from ${socket.id} for topic '${topic}': ${message}`
    );

    io.to(topic).emit("newMessage", { topic, message });
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
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
  });

  //////////////////////  Mqtt message sent to iotcore /////////////////////////////
  // Event listener for incoming MQTT messages
  client.on("message", async (topic, message) => {
    try {
      if (message) {
        setTimeout(() => {
          // console.log("message:::::", message.toString());
        }, 5000);

        let mqttmsg = JSON.parse(message.toString());

        let normalizedJSON;
        // Check message version for different normalization protocols
        if (mqttmsg?.ver === "JSON_2.0") {
          // Normalize using protocol 2.0
          normalizedJSON = await normalizedJSON2(mqttmsg);

          await sendNormalizedJsonToAwsIotCore(normalizedJSON);
        } else {
          // Protocol document 1 message normalization
          normalizedJSON = await jsonNormalization(mqttmsg);
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

/////////////////////////  Socket message publish api  ///////////////////////

app.post("/publishToSocket", (req, res) => {
  const { topic, message } = req.body;

  if (!topic || !message) {
    return res
      .status(400)
      .json({ error: "Topic and message are required in the request body." });
  }

  try {
    const stringifiedMessage =
      typeof message === "object" ? JSON.stringify(message) : message;

    io.to(topic).emit("newMessage", { topic, message: stringifiedMessage });
    console.log(
      `HTTP POST: Published message to topic '${topic}': ${stringifiedMessage}`
    );

    res
      .status(200)
      .json({ success: true, message: "Message published successfully." });
  } catch (error) {
    console.error("Error publishing message via HTTP POST:", error);
    res
      .status(500)
      .json({ error: "Failed to publish message.", details: error.message });
  }
});

// Start the server and listen for incoming requests
httpServer.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
