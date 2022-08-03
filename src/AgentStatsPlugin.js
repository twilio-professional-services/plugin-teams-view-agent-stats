import React from "react";
import { FlexPlugin } from "@twilio/flex-plugin";
import { CustomizationProvider } from "@twilio-paste/core/customization";
import { AgentStatsCard } from "./components/AgentStatsCard";
import { ColumnDefinition } from "@twilio/flex-ui";
import { Paragraph } from "@twilio-paste/core";

const PLUGIN_NAME = "AgentStatsPlugin";

export default class AgentStatsPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   */
  async init(flex, manager) {
    flex.setProviders({
      PasteThemeProvider: CustomizationProvider,
    });
    flex.WorkersDataTable.Content.add(
      <ColumnDefinition
        key="agent-stats"
        header={"Agent Voice Call Stats"}
        content={(items, context) => (
          <AgentStatsCard tasks={items} context={context} />
        )}
      />,
      {
        sortOrder: 0,
        align: "start",
      }
    );
  }
}
