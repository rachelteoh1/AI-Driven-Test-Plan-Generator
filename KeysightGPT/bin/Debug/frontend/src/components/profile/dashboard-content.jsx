import { FileText, Zap, Upload } from "lucide-react"
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
  background: ${({ theme }) => theme.home.pageGradient};
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
  border: 1px solid ${({ theme }) => theme.conversation.actionBorder};
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
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
    total_explanations,
    total_manuals_uploaded,
    month,
    monthly_stats,
    weekly_stats,
  } = data

  // Weekly data for line chart (SCPI Generated)
  const scpiGeneratedWeeklyData = weekly_stats.map((item, index) => ({
    week: `Week ${index + 1}`,
    value: item.scpi_generated,
  }))

  // Monthly data for circular chart (SCPI Explained)
  const currentMonthStats = monthly_stats.find(
    stat => new Date(stat.month_start).getMonth() === new Date(month).getMonth()
  ) || { scpi_generated: 0, scpi_explained: 0 }

  return (
    <Container>
      <Wrapper>
        <ThreeColGrid>
          <StyledCard>
            <CardContent>
              <FlexColumn>
                <FlexRow>
                  <StatIcon style={{ backgroundColor: "#DBEAFE" }}>
                    <Zap style={{ height: 12, width: 12, color: COLORS.secondary }} />
                  </StatIcon>
                </FlexRow>
                <div>
                  <StatTitle>Test Plans Generated</StatTitle>
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
                    <FileText style={{ height: 12, width: 12, color: "#7C3AED" }} />
                  </StatIcon>
                </FlexRow>
                <div>
                  <StatTitle>SCPI Explained</StatTitle>
                  <StatValue>{total_explanations}</StatValue>
                </div>
              </FlexColumn>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <FlexColumn>
                <FlexRow>
                  <StatIcon style={{ backgroundColor: "#D1FAE5" }}>
                    <Upload style={{ height: 12, width: 12, color: "#16A34A" }} />
                  </StatIcon>
                </FlexRow>
                <div>
                  <StatTitle>Manuals Uploaded</StatTitle>
                  <StatValue>{total_manuals_uploaded}</StatValue>
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
                    <Zap />
                  </SmallerIconWrapper>
                  <span>
                    {new Date(month).toLocaleString("default", { month: "long" })} - SCPI Generated (Weekly)
                  </span>
                </MetricHeader>

                <div>
                  <StatValue>
                    {weekly_stats.reduce((sum, item) => sum + item.scpi_generated, 0)}
                  </StatValue>
                  <p style={{ fontSize: FONTSIZE.sm, color: COLORS.medium }}>
                    This Month Total
                  </p>
                </div>

                <div style={{ marginTop: SPACING.sm }}>
                  <ShadMetricsChart data={scpiGeneratedWeeklyData} />
                </div>
              </FlexColumn>
            </CardContent>
          </StyledCard>

          <StyledCard>
            <CardContent>
              <FlexColumn>
                <MetricHeader>
                  <SmallerIconWrapper>
                    <FileText />
                  </SmallerIconWrapper>
                  <span>
                    {new Date(month).toLocaleString("default", { month: "long" })} - SCPI Explained (Monthly)
                  </span>
                </MetricHeader>
                <TextCenter>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACING.sm }}>
                    <StatValue>{currentMonthStats.scpi_explained}</StatValue>
                    <p style={{ fontSize: FONTSIZE.sm, color: COLORS.medium }}>
                      This Month
                    </p>
                    <ShadCircularProgress
                      value={currentMonthStats.scpi_explained}
                      max={Math.max(currentMonthStats.scpi_explained, 100)}
                      size={125}
                    />
                  </div>
                </TextCenter>
              </FlexColumn>
            </CardContent>
          </StyledCard>
        </TwoColGrid>
      </Wrapper>
    </Container>
  )
}