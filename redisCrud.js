const redis = require("./redisConnection"); // Import the Redis client from redisConnection.js

async function setRedisData(key, value) {
  try {
    const result = await redis.set(key, value);
    console.log(
      `Redis: Successfully set key "${key}" with value "${value}". Result: ${result}`
    );
    return result;
  } catch (error) {
    console.error(`Redis: Error setting data for key "${key}":`, error);
    throw error; // Re-throw the error for the calling function to handle
  }
}

async function getRedisData(key) {
  try {
    const value = await redis.get(key);

    if (value !== null) {
      console.log(
        `Redis: Successfully retrieved key "${key}". Value: ${value}.`
      );
    } else {
      console.log(`Redis: Key "${key}" not found.`);
    }
    return value;
  } catch (error) {
    console.error(`Redis: Error getting data for key "${key}":`, error);
    throw error;
  }
}

async function deleteRedisData(key) {
  try {
    const deletedCount = await redis.del(key);

    if (deletedCount === 1) {
      console.log(`Redis: Successfully deleted key "${key}".`);
      return true;
    } else if (deletedCount === 0) {
      console.log(`Redis: Key "${key}" not found (nothing to delete).`);
      return false;
    } else {
      console.warn(
        `Redis: Unexpected result from deleting key "${key}". Deleted count: ${deletedCount}`
      );
      return deletedCount > 0;
    }
  } catch (error) {
    console.error(`Redis: Error deleting data for key "${key}":`, error);
    throw error;
  }
}

module.exports = { setRedisData, getRedisData, deleteRedisData };
