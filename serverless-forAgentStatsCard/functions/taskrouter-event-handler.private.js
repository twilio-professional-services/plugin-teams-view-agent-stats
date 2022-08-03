const fetchSyncDoc = (client, syncServiceSid, syncDocName) => {
  return (syncDoc = client.sync.v1
    .services(syncServiceSid)
    .documents(syncDocName)
    .fetch());
};

const createSyncDoc = (client, syncServiceSid, syncDocName) => {
  return client.sync.v1.services(syncServiceSid).documents.create({
    uniqueName: syncDocName,
    data: {
      reservationStats: {
        answered: 0,
        outbound: 0,
        rejected: 0,
        missed: 0,
      },
      loginTimestamp: 0,
      activeCallSeconds: 0,
    },
  });
};

const updateSyncDoc = (client, syncServiceSid, syncDoc) => {
  return client.sync.v1
    .services(syncServiceSid)
    .documents(syncDoc.uniqueName)
    .update({ data: syncDoc.data });
};

const updateLoginTimestamp = (client, syncServiceSid, syncDoc) => {
  syncDoc.data.loginTimestamp = Date.now();
  syncDoc.data.activeCallSeconds = 0;
  syncDoc.data.reservationStats = {
    answered: 0,
    outbound: 0,
    missed: 0,
    rejected: 0,
  };

  return client.sync.v1
    .services(syncServiceSid)
    .documents(syncDoc.uniqueName)
    .update({ data: syncDoc.data });
};

const firstLoginOfDayCheck = (syncDoc) => {
  const loginTimestamp = syncDoc.data.loginTimestamp;

  const loginDate = new Date(loginTimestamp);
  const now = new Date();

  return !(loginDate.toDateString() === now.toDateString());
};

const getCallDuration = async (client, callSid) => {
  call = await client.calls(callSid).fetch();
  return parseInt(call.duration);
};

exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();
  const syncServiceSid = context.TWILIO_SYNC_SERVICE_SID;
  const {
    EventType,
    ResourceSid,
    WorkerSid,
    WorkerActivityName,
    TaskAttributes,
    TaskChannelUniqueName,
  } = event;

  const ActivityUpdated = "worker.activity.update";
  const ReservationAccepted = "reservation.accepted";
  const ReservationWrapup = "reservation.wrapup";
  const ReservationRejected = "reservation.rejected";
  const ReservationTimeout = "reservation.timeout";
  const eventsToHandle = [
    ActivityUpdated,
    ReservationAccepted,
    ReservationWrapup,
    ReservationRejected,
    ReservationTimeout,
  ];

  try {
    if (eventsToHandle.includes(EventType)) {
      console.log(`Handling ${EventType} for ${ResourceSid}`);

      const syncDocName = `workerStatsFor-${WorkerSid}`;

      let syncDoc = null;
      try {
        syncDoc = await fetchSyncDoc(client, syncServiceSid, syncDocName);
      } catch (error) {
        console.log(
          "Error fetching sync doc. Assume it didn't existe and create one",
          error
        );
        syncDoc = await createSyncDoc(client, syncServiceSid, syncDocName);
      }

      if (EventType === ActivityUpdated && WorkerActivityName === "Available") {
        if (firstLoginOfDayCheck(syncDoc)) {
          await updateLoginTimestamp(client, syncServiceSid, syncDoc);
        }
      } else {
        if (TaskChannelUniqueName === "voice") {
          const taskAttributes = JSON.parse(TaskAttributes);
          switch (EventType) {
            case ReservationAccepted: {
              taskAttributes.direction === "inbound"
                ? syncDoc.data.reservationStats.answered++
                : syncDoc.data.reservationStats.outbound++;
              await updateSyncDoc(client, syncServiceSid, syncDoc);
              break;
            }
            case ReservationWrapup: {
              const agentCallDuration = await getCallDuration(
                client,
                taskAttributes.conference.participants.worker
              );

              syncDoc.data.activeCallSeconds += agentCallDuration;
              await updateSyncDoc(client, syncServiceSid, syncDoc);
              break;
            }
            case ReservationRejected: {
              syncDoc.data.reservationStats.rejected++;
              await updateSyncDoc(client, syncServiceSid, syncDoc);
              break;
            }
            case ReservationTimeout: {
              syncDoc.data.reservationStats.missed++;
              await updateSyncDoc(client, syncServiceSid, syncDoc);
              break;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
    return callback(error, null);
  }

  const response = new Twilio.Response();
  response.setStatusCode(204);
  return callback(null, response);
};
