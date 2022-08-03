import { Ticker } from "../Ticker/Ticker"
import { Grid, Column, Flex, Box, Paragraph, Text } from "@twilio-paste/core";

const AgentStatsCard = (props) => {
  const {
    getLoginTimeStrings,
    getUtilizationString,
    answered,
    outbound,
    rejected,
    missed,
  } = props;

  return (
    <Box
      marginLeft="space20"
      marginRight="space20"
      marginTop="space10"
      marginBottom="space10"
    >
      <Grid gutter="space10" equalColumnHeights>
        <Column>
          <Box padding="space10">
            <Paragraph marginBottom="space0">
              {getLoginTimeStrings().loginTimeStringFirstLine}
            </Paragraph>
            <Ticker tickRate="tick10s">
              {() => (
                <Paragraph marginBottom="space0">
                  {getLoginTimeStrings().loginTimeStringSecondLine}
                </Paragraph>
              )}
            </Ticker>
          </Box>
        </Column>
        <Column>
          <Box padding="space10">
            <Ticker tickRate="tick10s">
              {() => {
                const { utilizationString, warning } = getUtilizationString();
                if (warning) {
                  return (
                    <Text color="colorTextErrorWeak">{utilizationString}</Text>
                  );
                } else {
                  return <Text>{utilizationString}</Text>;
                }
              }}
            </Ticker>
          </Box>
        </Column>
        <Column>
          <Box padding="space10">
            <Flex vertical>
              <Flex>
                <Box padding="space10">answered - {answered}</Box>
              </Flex>
              <Flex>
                <Box padding="space10">outbound - {outbound}</Box>
              </Flex>
              <Flex>
                <Box padding="space10">rejected - {rejected}</Box>
              </Flex>
              <Flex>
                <Box padding="space10">missed - {missed}</Box>
              </Flex>
            </Flex>
          </Box>
        </Column>
      </Grid>
    </Box>
  );
};

export default AgentStatsCard;
