const awsIot = require("aws-iot-device-sdk");

const awsIotConfig = {
  keyPath:
    "./Certificates/381fe907ebed8fb5ce2683f30d361978a10b0fca63dd95fc15f2228b1f433768-private.pem.key",
  certPath:
    "./Certificates/381fe907ebed8fb5ce2683f30d361978a10b0fca63dd95fc15f2228b1f433768-certificate.pem.crt",
  caPath: "./Certificates/AmazonRootCA1.pem",
  clientId: "device-laptop-001",
  host: "au1p8ws9jgmvf-ats.iot.ap-south-1.amazonaws.com",
};

const device = new awsIot.device(awsIotConfig);
let awsIotConnected = false;

const connectToAwsIot = () => {
  device.on("connect", () => {
    console.log("Connected to AWS IoT Core!");
    awsIotConnected = true;
  });

  device.on("reconnect", () => {
    console.log("Reconnecting to AWS IoT Core...");
    awsIotConnected = false;
  });

  device.on("offline", () => {
    console.log("Offline from AWS IoT Core.");
    awsIotConnected = false;
  });

  device.on("error", (error) => {
    console.error("Error connecting to AWS IoT Core:", error);
    awsIotConnected = false;
  });

  device.on("message", (topic, payload) => {
    console.log(
      "Message received from AWS IoT Core:",
      topic,
      payload.toString()
    );
  });
};

connectToAwsIot();

// Function to transfer normalized JSON to AWS IoT Core
const sendNormalizedJsonToAwsIotCore = async (normalizedJSON) => {
  return new Promise((resolve, reject) => {
    if (!awsIotConnected) {
      const errorMessage =
        "Not connected to AWS IoT Core. Unable to send message.";
      console.error(errorMessage);
      return reject(new Error(errorMessage));
    }

    const topic = JSON.parse(normalizedJSON).HMI_ID;
    const message = normalizedJSON;

    device.publish(topic, message, (err) => {
      if (err) {
        console.error("Error publishing to AWS IoT Core:", err);
        reject(err);
        return "Error in iot publish";
      } else {
        console.log("Successfully published to AWS IoT Core:", topic, message);
        resolve();
        return "success in iotcore publish";
      }
    });
  });
};

module.exports = { sendNormalizedJsonToAwsIotCore };
