import { useEffect, useState } from "react";
import { SYNC_CLIENT as syncClient } from "../../helpers/syncHelper";
import AgentStatsCard from "./AgentStatsCard";
import moment from "moment";

export const AgentStatsCardContainer = (props) => {
  const [statsDocData, setStatsDocData] = useState({});
  const [statsDoc, setStatsDoc] = useState(null);

  useEffect(() => {
    const workerSid = props.tasks.worker.sid;

    const fetchAndSubcribeToSyncDoc = async (workerSid) => {
      try {
        const workerDoc = await syncClient.document({
          id: `workerStatsFor-${workerSid}`,
          mode: "open_or_create",
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

        // store the doc so we can close it on unmount
        setStatsDoc(workerDoc);
        setStatsDocData(workerDoc.data);

        workerDoc.on("updated", (args) => {
          console.log(`Documet ${workerDoc.sid} updated`);
          setStatsDocData(workerDoc.data);
        });
      } catch (error) {
        console.error(`Error fetchAndSubcribeToDoc for ${workerSid}`, error);
      }
    };

    fetchAndSubcribeToSyncDoc(workerSid);

    return () => {
      if (statsDoc) statsDoc.close();
    };
  }, []);

  let answered = 0;
  let outbound = 0;
  let rejected = 0;
  let missed = 0;

  if (!statsDocData.loginTimestamp) statsDocData.loginTimestamp = 0;

  const loginDate = new Date(statsDocData.loginTimestamp);
  const now = new Date();
  // if the login date isn't today don't show old stats
  let statsValid = false;

  if (loginDate.toDateString() === now.toDateString()) {
    answered = statsDocData?.reservationStats.answered;
    outbound = statsDocData?.reservationStats.outbound;
    rejected = statsDocData?.reservationStats.rejected;
    missed = statsDocData?.reservationStats.missed;
    statsValid = true;

    let secondsSinceLogin = (Date.now() - statsDocData.loginTimestamp) / 1000;
    if (secondsSinceLogin < 0) secondsSinceLogin = 0;
  }

  const getLoginTimeStrings = () => {
    let loginTimeStringFirstLine = "Not logged in today";
    let loginTimeStringSecondLine = "";

    if (statsValid) {
      loginTimeStringFirstLine = `Login at ${loginDate.toLocaleTimeString()}`;
      loginTimeStringSecondLine = moment(loginDate).fromNow();
    }

    return { loginTimeStringFirstLine, loginTimeStringSecondLine };
  };

  const getUtilizationString = () => {
    let utilizationString = "Not logged in today";
    let activeCallDurationSeconds = 0;
    let warning = false;

    if (statsValid) {
      let historicalActiveCallSeconds = statsDocData?.activeCallSeconds;
      historicalActiveCallSeconds = historicalActiveCallSeconds
        ? historicalActiveCallSeconds
        : 0;

      // as well as the historical count of seconds of call time take into account if there is an active call
      props.tasks.tasks.forEach((task) => {
        if (
          task.taskChannelUniqueName === "voice" &&
          task.status === "accepted"
        ) {
          activeCallDurationSeconds = Math.ceil(
            (Date.now() - task.dateUpdated.getTime()) / 1000
          );
        }
      });

      const totalCallSeconds =
        historicalActiveCallSeconds + activeCallDurationSeconds;
      const minutesOfTalkTime = Math.ceil(totalCallSeconds / 60);

      const secondsSinceLogin =
        (Date.now() - statsDocData.loginTimestamp) / 1000;
      const utilization = Math.ceil(
        (totalCallSeconds / secondsSinceLogin) * 100
      );

      utilizationString = `${minutesOfTalkTime} mins of talk time (${utilization}% utilization)`;

      if (utilization < 50) warning = true;
    }

    return { utilizationString, warning };
  };

  return (
    <AgentStatsCard
      getLoginTimeStrings={getLoginTimeStrings}
      getUtilizationString={getUtilizationString}
      answered={answered}
      outbound={outbound}
      rejected={rejected}
      missed={missed}
    />
  );
};
