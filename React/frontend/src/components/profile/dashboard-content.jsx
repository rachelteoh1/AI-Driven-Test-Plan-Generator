import { BarChart3 } from "lucide-react";
import styled from "styled-components";
import { ShadMetricsChart } from "./ShadMetricsChart";
import { ShadCircularProgress } from "./ShadCircularProgress";
import { useUserDashboard } from "../../hook/useDashboard";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  width: 100%;
`;

const Wrapper = styled.div`
  width: 100%;
  max-width: 768px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* Reduced vertical gap */
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem; /* Reduced gap between cards */
`;

const ThreeColGrid = styled(Grid)`
  grid-template-columns: repeat(3, 1fr);
`;

const TwoColGrid = styled(Grid)`
  grid-template-columns: repeat(2, 1fr);
  padding-top: 0rem; /* Reduced padding top */
`;

const StyledCard = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const CardContent = styled.div`
  padding: 2rem;
`;

const StatIcon = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatTitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
`;

const InstrumentValue = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
`;

const TextCenter = styled.div`
  text-align: center;
`;

const FlexColumnSpaceY4 = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem; /* controls spacing between elements vertically */
`;

const FlexRowCenterGap2 = styled.div`
  display: flex;
  align-items: center;
  gap: 0rem;
`;

const SmallIconWrapper = styled(StatIcon)`
  & > svg {
    height: 0.75rem; /* 12px */
    width: 0.75rem;
  }
`;

const SmallerIconWrapper = styled(StatIcon)`
  width: 1rem;
  height: 1rem;
  background-color: #fbcfe8;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  & > svg {
    height: 0.5rem; /* 8px */
    width: 0.5rem;
    color: #db2777;
  }
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

export function DashboardContent() {
    const { data, isLoading, isError } = useUserDashboard();

  if (isLoading) return <Container>Loading...</Container>;
  if (isError) return <Container>Error loading dashboard data.</Container>;

  const {
    total_test_plans,
    total_commands_generated,
    total_minutes_saved,
    most_used_device,
    month,
  } = data;

  const metricsData = data.weekly_stats.map((item, index) => ({
  week: `Week ${data.weekly_stats.length - index}`,
  value: item.minutes_saved,
}));


  return (
    <Container>
      <Wrapper>
        <ThreeColGrid>
          <StyledCard>
            <CardContent>
              <FlexColumnSpaceY4>
                <FlexRowCenterGap2>
                  <StatIcon style={{ backgroundColor: "#DBEAFE" }}>
                    <BarChart3 style={{ height: 12, width: 12, color: "#2563EB" }} />
                  </StatIcon>
                </FlexRowCenterGap2>

                <div>
                  <StatTitle>Total test plan generated</StatTitle>
                  <StatValue>{total_test_plans}</StatValue>
                </div>
              </FlexColumnSpaceY4>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <FlexColumnSpaceY4>
                <FlexRowCenterGap2>
                  <StatIcon style={{ backgroundColor: "#EDE9FE" }}>
                    <BarChart3 style={{ height: 12, width: 12, color: "#7C3AED" }} />
                  </StatIcon>
                </FlexRowCenterGap2>

                <div>
                  <StatTitle>Total SCPI generated</StatTitle>
                  <StatValue>{total_commands_generated}</StatValue>
                </div>
              </FlexColumnSpaceY4>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <FlexColumnSpaceY4>
                <FlexRowCenterGap2>
                  <StatIcon style={{ backgroundColor: "#D1FAE5" }}>
                    <BarChart3 style={{ height: 12, width: 12, color: "#16A34A" }} />
                  </StatIcon>
                </FlexRowCenterGap2>

                <div>
                  <StatTitle>Most Used Instrument</StatTitle>
                  <InstrumentValue>{most_used_device}</InstrumentValue>
                </div>
              </FlexColumnSpaceY4>
            </CardContent>
          </StyledCard>
        </ThreeColGrid>

        <TwoColGrid>
          <StyledCard>
            <CardContent>
              <FlexColumnSpaceY4>
                <MetricHeader>
                  <SmallerIconWrapper>
                    <BarChart3 />
                  </SmallerIconWrapper>
                  <span>{new Date(month).toLocaleString("default", { month: "long" })}</span>
                </MetricHeader>

                <div>
                  <p
                    style={{
                      fontSize: "1.875rem",
                      fontWeight: "bold",
                      color: "#111827",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {Math.min(Math.round((total_minutes_saved / 60) * 100), 100)}%
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>
                    Reduced execution time
                  </p>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <ShadMetricsChart data={metricsData} />
                </div>
              </FlexColumnSpaceY4>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: "1.5rem",
                }}
              >
                <TextCenter>
                  <p
                    style={{
                      fontSize: "1.875rem",
                      fontWeight: "bold",
                      color: "#111827",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {total_minutes_saved} Mins
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>
                    Minutes Saved
                  </p>
                </TextCenter>

                <ShadCircularProgress value={total_minutes_saved} max={60} size={125} />
              </div>
            </CardContent>
          </StyledCard>
        </TwoColGrid>
      </Wrapper>
    </Container>
  );
}
