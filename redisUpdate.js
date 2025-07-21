const { default: axios } = require("axios");

const updateRedisData = async (normalizedJSON) => {
  normalizedJSON = JSON.parse(normalizedJSON);
  let redisPayload = {};

  try {
    await axios
      .get(`http://13.204.85.8:5001/get-redis-data/${normalizedJSON.HMI_ID}`)
      .then((res) => {
        redisPayload = JSON.parse(res.data.data);
      })
      .catch((err) => {
        console.log("Error in getting redisData", err);
      });

    redisPayload.Location_data = redisPayload.Location_data || {};
    redisPayload.vehicle_Data = redisPayload.vehicle_Data || {};
    redisPayload.alerts_details = redisPayload.alerts_details || {};

    redisPayload.Location_data.lat = normalizedJSON.lat;
    redisPayload.Location_data.lng = normalizedJSON.lng;
    redisPayload.Location_data.spd_gps = normalizedJSON.spd_gps;
    redisPayload.Location_data.timestamp = normalizedJSON.device_timestamp;
    redisPayload.vehicle_Data.vehicle_status = "Running";
    redisPayload.Location_data.JSON_DUMP = normalizedJSON.JSON_DUMP;

    if (normalizedJSON.subevent) {
      redisPayload.alerts_details[normalizedJSON.subevent] =
        normalizedJSON.device_timestamp;
      redisPayload.alerts_details[normalizedJSON.subevent + "json"] =
        normalizedJSON.JSON_DUMP;
    }

    try {
      let updateRedisApi = await axios.post(
        "http://13.204.85.8:5001/set-redis-data",
        redisPayload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("updateRedisApi::::", updateRedisApi);
    } catch (redisErr) {
      console.error("Failed to set Redis data:", redisErr.message);
      return "failed";
    }

    return "Success";
  } catch (err) {
    console.log("RedisUpdateError::::::", err);
    return "failed";
  }
};

module.exports = { updateRedisData };
