import { Manager } from "@twilio/flex-ui";
import { SyncClient } from "twilio-sync";

const manager = Manager.getInstance();
export const SYNC_CLIENT = new SyncClient(Manager.getInstance().user.token);

function tokenUpdateHandler() {
  const loginHandler = manager.store.getState().flex.session.loginHandler;

  const tokenInfo = loginHandler.getTokenInfo();
  const accessToken = tokenInfo.token;

  SYNC_CLIENT.updateToken(accessToken);
}

manager.events.addListener("tokenUpdated", tokenUpdateHandler);
