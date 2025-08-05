const normalizedJSON2 = async (msg) => {
  try {
    if (
      msg.td &&
      msg.td.lat &&
      msg.td.lng &&
      (msg.td.lat == 0 ||
        msg.td.lng == 0 ||
        msg.td.lat == 999 ||
        msg.td.lng == 999 ||
        msg.td.lat == null ||
        msg.td.lng == null ||
        msg.dev_id === "EC0000A")
    ) {
      console.log(msg.device_id, msg.td.lng, msg.td.lat);

      return "INVALID_JSON";
    }

    //Normalized JSON Format
    let normalizedJSON = {
      HMI_ID: msg.dev_id || "STARK1",
      HMI_Timestamp: msg.time || "1672511400",
      lat: msg.td?.lat || "18.55390",
      lng: msg.td?.lng || "73.80675",
      rssi: msg.td?.rssi || 0,
      spd_gps: msg.td?.spd || "0",
      HMI_tripId: msg.trip_id || "0001",
      HMI_trip_status: msg.trip_id ? "1" : "0" || "0",
      spd_wire: msg.data.spd || "0",
      device_id: msg.dev_id || "STARK1",
      device_type: msg.dev_typ || "HMI",
      device_trip_status: msg.trip_id ? "1" : "0" || "1",
      device_trip_id: msg.trip_id || "0",
      device_timestamp: msg.time || "1672511400",
      igs: msg.ignition || "0",
      msg_no: msg.msg || "0",
      event: msg.event || "INVALIDJSON",
      subevent: msg.event || "ALERT",
      severity: msg.data.severity || "HIGH",
      reason: "Event Alert",
      event_status: "0",
      driver_id: "0",
      driver_status: "1",
      device_data: msg.data || {},
      media: {
        dashCam: msg.data.dashcam || "",
        inCabin: msg.data.media || "",
        image: "",
      },
      JSON_DUMP: JSON.stringify(msg),
    };

    /// check for alert messages

    //////////////////////////////////   ALM   /////////////////////////////////////////////////////
    if (msg.event === "ALM") {
      //Alarm Alert Check
      if (msg.data.alm === 3) {
        //ALARM 3
        normalizedJSON.subevent = "ALM3";
        normalizedJSON.severity = "MEDIUM";
        normalizedJSON.reason = "ALARM 3";
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.event_status = msg.data.alm;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.alm === 2) {
        //ALARM 2
        normalizedJSON.subevent = "ALM2";
        normalizedJSON.severity = "LOW";
        normalizedJSON.reason = "ALARM 2";
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.event_status = msg.data.alm;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.alm === 1) {
        //ALARM 1
        normalizedJSON.subevent = "ALM1";
        normalizedJSON.severity = "LOW";
        normalizedJSON.reason = "ALARM 1";
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.event_status = msg.data.alm;

        return JSON.stringify(normalizedJSON);
      }
    }
    /////////////////////////////////////////  BRK //////////////////////////////////////////
    else if (msg.event === "BRK") {
      //Brake Alert Calculations
      let ttcdiff = msg.data.on_ttc - msg.data.off_ttc;
      let acd = ttcdiff / msg.data.off_ttc;
      let accSvd = acd * 100;

      if (accSvd > 50 && accSvd < 100) {
        //Accident saved alert
        normalizedJSON.subevent = "ASV";
        normalizedJSON.severity = "HIGH";
        normalizedJSON.reason = msg.data.rsn;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.event_status = msg.data.sts;

        return JSON.stringify(normalizedJSON);
      } else {
        //automatic braking alert
        normalizedJSON.subevent = "AUB";
        normalizedJSON.severity = "HIGH";
        normalizedJSON.reason = msg.data.rsn;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.event_status = msg.data.sts;

        return JSON.stringify(normalizedJSON);
      }
    }
    /////////////////////////////////////////  ACC  //////////////////////////////////////////
    else if (msg.event === "ACC") {
      //Accelerator cut
      normalizedJSON.subevent = "ACC";
      normalizedJSON.severity = "HIGH";
      normalizedJSON.event_status = msg.data.sts;
      normalizedJSON.reason = msg.data.rsn;
      normalizedJSON.device_data = msg.data || {};
      normalizedJSON.spd_wire = msg.data.spd;

      return JSON.stringify(normalizedJSON);
    }
    //////////////////////////////////////////   LMP  ///////////////////////////////////////////
    else if (msg.event == "LMP") {
      //LIMP Mode event
      normalizedJSON.subevent = "LMP";
      normalizedJSON.severity = "HIGH";
      normalizedJSON.event_status = msg.data.sts;
      normalizedJSON.reason = msg.data.rsn;
      normalizedJSON.device_data = msg.data || {};

      return JSON.stringify(normalizedJSON);
    }
    /////////////////////////////////////      ACD    /////////////////////////////////////////////
    else if (msg.event == "ACD") {
      //accident alert
      normalizedJSON.subevent = "ACD";
      normalizedJSON.severity = "HIGH";
      normalizedJSON.event_status = msg.data.sts;
      normalizedJSON.device_data = msg.data || {};

      return JSON.stringify(normalizedJSON);
    }
    ///////////////////////////////////   NTF   ///////////////////////////////////////////////////////
    else if (msg.event == "NTF") {
      //NOTIFICATION DATA

      if (msg.ntf == 1) {
        //Safe Zone
        normalizedJSON.subevent = "SAF";
        normalizedJSON.severity = "LOW";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 2) {
        //Harsh Acceleration
        normalizedJSON.subevent = "HRA";
        normalizedJSON.severity = "LOW";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 3) {
        //Sudden Braking
        normalizedJSON.subevent = "SUB";
        normalizedJSON.severity = "LOW";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 4) {
        //Speed Bump
        normalizedJSON.subevent = "SPB";
        normalizedJSON.severity = "LOW";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 5) {
        //Lane Change
        normalizedJSON.subevent = "LCH";
        normalizedJSON.severity = "LOW";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 6) {
        //Tailgating
        normalizedJSON.subevent = "TAL";
        normalizedJSON.severity = "MEDIUM";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 7) {
        //CAS Overspeed
        normalizedJSON.subevent = "CAO";
        normalizedJSON.severity = "LOW";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 15) {
        //Sleep Alert Missed
        normalizedJSON.subevent = "SLPM";
        normalizedJSON.severity = "HIGH";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 16) {
        //Tipper Accelerator Cut
        normalizedJSON.subevent = "TACC";
        normalizedJSON.severity = "HIGH";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 17) {
        //CVN Wrong Start
        normalizedJSON.subevent = "WCVN";
        normalizedJSON.severity = "HIGH";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 18) {
        //LOAD Overload
        normalizedJSON.subevent = "LOVE";
        normalizedJSON.severity = "HIGH";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else if (msg.ntf == 19) {
        //Fuel Theft
        normalizedJSON.subevent = "FTH";
        normalizedJSON.severity = "HIGH";
        normalizedJSON.event_status = msg.ntf;
        normalizedJSON.spd_wire = msg.data.spd;

        return JSON.stringify(normalizedJSON);
      } else {
        return JSON.stringify(normalizedJSON);
      }
    }
    /////////////////////////////////////  DMS  ///////////////////////////////////////////////
    else if (msg.event == "DMS") {
      //DMS Alert distribution
      if (msg.data.alert_type == "OVERSPEEDING") {
        normalizedJSON.subevent = "DMSO";
        normalizedJSON.severity = "MEDIUM";
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.media.dashCam = msg.data.dashcam;
        normalizedJSON.media.inCabin = msg.data.media;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.alert_type == "DISTRACTION") {
        normalizedJSON.subevent = "DIS";
        normalizedJSON.severity = "MEDIUM";
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.media.dashCam = msg.data.dashcam;
        normalizedJSON.media.inCabin = msg.data.media;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.alert_type == "DROWSINESS") {
        normalizedJSON.subevent = "DROW";
        normalizedJSON.severity = "HIGH";
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.media.dashCam = msg.data.dashcam;
        normalizedJSON.media.inCabin = msg.data.media;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.alert_type == "NO_DRIVER") {
        normalizedJSON.subevent = "NODR";
        normalizedJSON.severity = "LOW";
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.media.dashCam = msg.data.dashcam;
        normalizedJSON.media.inCabin = msg.data.media;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.alert_type == "TRIP_START") {
        normalizedJSON.subevent = "TS";
        normalizedJSON.severity = "LOW";
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.media.dashCam = msg.data.dashcam;
        normalizedJSON.media.inCabin = msg.data.media;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.alert_type == "SMOKING") {
        normalizedJSON.subevent = "SMO";
        normalizedJSON.severity = "LOW";
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.media.dashCam = msg.data.dashcam;
        normalizedJSON.media.inCabin = msg.data.media;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.alert_type == "YAWNING") {
        normalizedJSON.subevent = "YWN";
        normalizedJSON.severity = "LOW";
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.media.dashCam = msg.data.dashcam;
        normalizedJSON.media.inCabin = msg.data.media;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.alert_type == "USING_PHONE") {
        normalizedJSON.subevent = "PHO";
        normalizedJSON.severity = "LOW";
        normalizedJSON.spd_wire = msg.data.spd;
        normalizedJSON.device_data = msg.data || {};
        normalizedJSON.media.dashCam = msg.data.dashcam;
        normalizedJSON.media.inCabin = msg.data.media;

        return JSON.stringify(normalizedJSON);
      } else {
        return JSON.stringify(normalizedJSON);
      }
    }
    //////////////////////////////////////    ALC  /////////////////////////////////////////////////
    else if (msg.event == "ALR") {
      //Alcohol based alerts
      if (msg.data.sts == 0) {
        //Alcohol Fail
        normalizedJSON.subevent = "ALCF";
        normalizedJSON.severity = "HIGH";
        normalizedJSON.event_status = msg.data.sts;

        return JSON.stringify(normalizedJSON);
      } else if (msg.data.sts == 1) {
        //alcohol Pass
        normalizedJSON.subevent = "ALCP";
        normalizedJSON.severity = "LOW";
        normalizedJSON.event_status = msg.data.sts;

        return JSON.stringify(normalizedJSON);
      }
    }
    /////////////////////////////////////    BYP  /////////////////////////////////////////////////////
    else if (msg.event == "BYP") {
      //Indicator based Brake Bypass
      normalizedJSON.subevent = "BYP";
      normalizedJSON.severity = "LOW";
      normalizedJSON.event_status = msg.data.status;
      normalizedJSON.device_data = msg.data;
      normalizedJSON.spd_wire = msg.data.spd;

      return JSON.stringify(normalizedJSON);
    }
    ///////////////////////////////////    CVN  /////////////////////////////////////////////////////
    else if (msg.event == "CVN") {
      //CVN DATA
      // normalizedJSON.subevent = "CVN";
      // normalizedJSON.severity = "LOW";
      // normalizedJSON.event_status = msg.data.status;
      // normalizedJSON.device_data = msg.data;
      // normalizedJSON.spd_wire = msg.speed;

      return JSON.stringify(normalizedJSON);
    }
    ////////////////////////////////////   FLS  //////////////////////////////////////////////////
    else if (msg.event == "FLS") {
      //Fuel DATA
      normalizedJSON.subevent = "FLS";
      normalizedJSON.severity = "LOW";
      normalizedJSON.device_data = msg.data;
      normalizedJSON.spd_wire = msg.speed;

      return JSON.stringify(normalizedJSON);
    }
    ////////////////////////////////////    LDS   /////////////////////////////////////////////////////
    else if (msg.event == "LDS") {
      //Load DATA
      normalizedJSON.subevent = "LDS";
      normalizedJSON.severity = "LOW";
      normalizedJSON.device_data = msg.Data;
      normalizedJSON.spd_wire = msg.speed;

      return JSON.stringify(normalizedJSON);
    }
    ////////////////////////////////////////  FST   //////////////////////////////////////////////////////
    else if (msg.event == "FST") {
      //featureset acknowledgement
      normalizedJSON.subevent = "FST";
      normalizedJSON.severity = "HIGH";
      normalizedJSON.status = msg.data.sts;
      normalizedJSON.device_data = msg.data;
      normalizedJSON.event_status = msg.data.sts;

      return JSON.stringify(normalizedJSON);
    } else if (msg.event == "LOC") {
      normalizedJSON.subevent = "LOC";
      normalizedJSON.severity = "LOW";

      return JSON.stringify(normalizedJSON);
    }
    ////////////////////////////////////////    Invalid JSON      ///////////////////////////////////////////
    else if (msg.event == "JSN") {
      normalizedJSON.subevent = "JSON_Invalid";
      normalizedJSON.severity = "LOW";
      return JSON.stringify(normalizedJSON);
    }
    ////////////////////////////////////  Alcohol Feature set acknowledgemen SET   /////////////////////////////
    else if (msg.event == "SET") {
      normalizedJSON.subevent = "SET";
      normalizedJSON.severity = "HIGH";
      normalizedJSON.device_data = msg.data;
      normalizedJSON.event_status = msg.data.sts;

      return JSON.stringify(normalizedJSON);
    }
    ///////////////////////////////////////////  IGS IGNITION  /////////////////////////////////////////////////////
    else if (msg.event == "IGS") {
      normalizedJSON.subevent = "IGS";
      normalizedJSON.severity = "LOW";

      return JSON.stringify(normalizedJSON);
    } else {
      return JSON.stringify(normalizedJSON);
    }
  } catch (err) {
    console.log("Error in normalizedjson 222!!!");
    return "failed to normalizedJSON 2";
  }
};

module.exports = { normalizedJSON2 };
