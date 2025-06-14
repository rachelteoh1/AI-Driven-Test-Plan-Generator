import { BarChart3 } from "lucide-react"
import styled from "styled-components"
import { ShadMetricsChart } from "./ShadMetricsChart"
import { ShadCircularProgress } from "./ShadCircularProgress"
import { useUserDashboard } from "../../hook/useDashboard"
import { COLORS, FONTSIZE, FONTWEIGHT, SPACING } from "../../lib/styles"

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  width: 100%;
  background-color: ${({ theme }) => theme.background};
`

const Wrapper = styled.div`
  width: 100%;
  max-width: 768px;
  display: flex;
  flex-direction: column;
  gap: ${SPACING.lg};
`

const Grid = styled.div`
  display: grid;
  gap: ${SPACING.md};
`

const ThreeColGrid = styled(Grid)`
  grid-template-columns: repeat(3, 1fr);
`

const TwoColGrid = styled(Grid)`
  grid-template-columns: repeat(2, 1fr);
`

const StyledCard = styled.div`
  background-color: ${({ theme }) => theme.card};
  border: 1px solid ${({ theme }) => theme.greys.medium};
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`

const CardContent = styled.div`
  padding: ${SPACING.xl};
`

const StatIcon = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StatTitle = styled.p`
  font-size: ${FONTSIZE.sm};
  color: ${({ theme }) => theme.greys.light};
  margin-bottom: ${SPACING.sm};
`

const StatValue = styled.p`
  font-size: ${FONTSIZE["2xl"]};
  font-weight: ${FONTWEIGHT.bold};
  color: ${({ theme }) => theme.text};
`

const InstrumentValue = styled.p`
  font-size: ${FONTSIZE.lg};
  font-weight: ${FONTWEIGHT.medium};
  color: ${({ theme }) => theme.text};
`

const TextCenter = styled.div`
  text-align: center;
`

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.md};
`

const FlexRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
`

const SmallerIconWrapper = styled(StatIcon)`
  width: 1rem;
  height: 1rem;
  background-color: #fbcfe8;
  & > svg {
    width: 0.5rem;
    height: 0.5rem;
    color: #db2777;
  }
`

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  font-size: ${FONTSIZE.sm};
  color: ${({ theme }) => theme.greys.light};
`

export function DashboardContent() {
  const { data, isLoading, isError } = useUserDashboard()

  if (isLoading) return <Container>Loading...</Container>
  if (isError) return <Container>Error loading dashboard data.</Container>

  const {
    total_test_plans,
    total_commands_generated,
    total_minutes_saved,
    most_used_device,
    month,
  } = data

  const metricsData = [...data.weekly_stats].reverse().map((item, index) => ({
    week: `Week ${index + 1}`,
    value: item.minutes_saved,
  }))

  return (
    <Container>
      <Wrapper>
        <ThreeColGrid>
          <StyledCard>
            <CardContent>
              <FlexColumn>
                <FlexRow>
                  <StatIcon style={{ backgroundColor: "#DBEAFE" }}>
                    <BarChart3 style={{ height: 12, width: 12, color: COLORS.secondary }} />
                  </StatIcon>
                </FlexRow>
                <div>
                  <StatTitle>Total test plan generated</StatTitle>
                  <StatValue>{total_test_plans}</StatValue>
                </div>
              </FlexColumn>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <FlexColumn>
                <FlexRow>
                  <StatIcon style={{ backgroundColor: "#EDE9FE" }}>
                    <BarChart3 style={{ height: 12, width: 12, color: "#7C3AED" }} />
                  </StatIcon>
                </FlexRow>
                <div>
                  <StatTitle>Total SCPI generated</StatTitle>
                  <StatValue>{total_commands_generated}</StatValue>
                </div>
              </FlexColumn>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <FlexColumn>
                <FlexRow>
                  <StatIcon style={{ backgroundColor: "#D1FAE5" }}>
                    <BarChart3 style={{ height: 12, width: 12, color: "#16A34A" }} />
                  </StatIcon>
                </FlexRow>
                <div>
                  <StatTitle>Most Used Instrument</StatTitle>
                  <InstrumentValue>{most_used_device}</InstrumentValue>
                </div>
              </FlexColumn>
            </CardContent>
          </StyledCard>
        </ThreeColGrid>

        <TwoColGrid>
          <StyledCard>
            <CardContent>
              <FlexColumn>
                <MetricHeader>
                  <SmallerIconWrapper>
                    <BarChart3 />
                  </SmallerIconWrapper>
                  <span>
                    {new Date(month).toLocaleString("default", { month: "long" })}
                  </span>
                </MetricHeader>

                <div>
                  <StatValue>
                    {Math.min(Math.round((total_minutes_saved / 60) * 100), 100)}%
                  </StatValue>
                  <p style={{ fontSize: FONTSIZE.sm, color: COLORS.medium }}>
                    Reduced execution time
                  </p>
                </div>

                <div style={{ marginTop: SPACING.sm }}>
                  <ShadMetricsChart data={metricsData} />
                </div>
              </FlexColumn>
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
                  gap: SPACING.lg,
                }}
              >
                <TextCenter>
                  <StatValue>
                    {total_minutes_saved} Mins
                  </StatValue>
                  <p style={{ fontSize: FONTSIZE.sm, color: COLORS.medium }}>
                    Minutes Saved
                  </p>
                </TextCenter>

                <ShadCircularProgress
                  value={total_minutes_saved}
                  max={60}
                  size={125}
                />
              </div>
            </CardContent>
          </StyledCard>
        </TwoColGrid>
      </Wrapper>
    </Container>
  )
}
