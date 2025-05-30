import { Card, CardContent } from "../ui/card"
import { BarChart3 } from "lucide-react"
import { MetricsChart } from "./metrics-chart"
import { CircularProgress } from "./circular-progress"

export function DashboardContent() {
  return (
    <div className="flex justify-center items-center min-h-full w-full">
      <div className="w-full max-w-3xl space-y-10">
        {/* Metrics Cards */}
        <div className="grid grid-cols-3 gap-8">
          <Card className="bg-white shadow-sm border border-gray-200 rounded-md">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-sm flex items-center justify-center">
                    <BarChart3 className="h-3 w-3 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total test plan generated</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 rounded-md">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-sm flex items-center justify-center">
                    <BarChart3 className="h-3 w-3 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total SCPI generated</p>
                  <p className="text-2xl font-bold text-gray-900">22</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 rounded-md">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-sm flex items-center justify-center">
                    <BarChart3 className="h-3 w-3 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Most Used Instrument</p>
                  <p className="text-lg font-semibold text-gray-900">Oscilloscope</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-10 pt-8">
          <Card className="bg-white shadow-sm border border-gray-200 rounded-md">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="w-4 h-4 bg-pink-200 rounded-sm flex items-center justify-center">
                    <BarChart3 className="h-2 w-2 text-pink-500" />
                  </div>
                  <span>This month</span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-2">15%</p>
                  <p className="text-sm text-gray-500">Reduced execution time</p>
                </div>
                <div className="mt-6">
                  <MetricsChart />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200 rounded-md">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-2">38 Mins</p>
                  <p className="text-sm text-gray-500">Minutes Saved</p>
                </div>
                <CircularProgress value={38} max={60} size={125} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
