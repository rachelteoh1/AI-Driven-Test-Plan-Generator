using System;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using Microsoft.Web.WebView2.Wpf;
using Newtonsoft.Json;
using System.Text;

namespace KeysightGPT
{
    public class KeysightGPTPanel : UserControl
    {
        private WebView2 webView;

        public KeysightGPTPanel()
        {
            InitializeWebView();
        }

        private async void InitializeWebView()
        {
            webView = new WebView2
            {
                HorizontalAlignment = HorizontalAlignment.Stretch,
                VerticalAlignment = VerticalAlignment.Stretch
            };

            var grid = new Grid();
            grid.Children.Add(webView);
            Content = grid;

            await webView.EnsureCoreWebView2Async();
            webView.Source = new Uri("http://localhost:3000");

            webView.WebMessageReceived += OnWebMessageReceived;

            Debug.WriteLine("[WebView] Initialized and listening for messages");
        }

        private void OnWebMessageReceived(object sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var rawJson = e.WebMessageAsJson;
                var unwrappedJson = Newtonsoft.Json.JsonConvert.DeserializeObject<string>(rawJson);

                Debug.WriteLine("[WebView] Received JSON: " + unwrappedJson);

                SaveJsonAsTapPlan(unwrappedJson);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("[WebView] Error parsing JSON: " + ex.Message);
            }
        }

        public static void SaveJsonAsTapPlan(string json)
        {
            if (string.IsNullOrWhiteSpace(json)) return;

            try
            {
                var block = Newtonsoft.Json.JsonConvert.DeserializeObject<ScpiCommandBlock>(json);
                if (block?.commands == null || block.commands.Count == 0) return;

                string folder = @"C:\Program Files\OpenTAP\tapplan";
                if (!System.IO.Directory.Exists(folder))
                    System.IO.Directory.CreateDirectory(folder);

                string path = System.IO.Path.Combine(folder, "WebViewTestPlan.tap");

                var sb = new System.Text.StringBuilder();
                sb.AppendLine(@"<?xml version=""1.0"" encoding=""utf-8""?>");
                sb.AppendLine(@"<TestPlan type=""OpenTap.TestPlan"">");
                sb.AppendLine("  <Steps>");

                foreach (var cmd in block.commands)
                {
                    string action = cmd.command.EndsWith("?") ? "Query" : "Command";

                    sb.AppendLine(@"    <TestStep type=""OpenTap.Plugins.BasicSteps.SCPIRegexStep"" Id=""" + Guid.NewGuid().ToString() + @""">");
                    sb.AppendLine(@"      <Instrument Source=""OpenTap.InstrumentSettings"">SCPI</Instrument>");
                    sb.AppendLine(@"      <Action>" + action + @"</Action>");
                    sb.AppendLine(@"      <Query>" + cmd.command + @"</Query>");
                    sb.AppendLine(@"      <AddToLog>true</AddToLog>");
                    sb.AppendLine(@"      <LogHeader />");
                    sb.AppendLine(@"      <RegularExpressionPattern>");
                    sb.AppendLine(@"        <Value>(.*)</Value>");
                    sb.AppendLine(@"        <IsEnabled>false</IsEnabled>");
                    sb.AppendLine(@"      </RegularExpressionPattern>");
                    sb.AppendLine(@"      <VerdictOnMatch>Pass</VerdictOnMatch>");
                    sb.AppendLine(@"      <VerdictOnNoMatch>Fail</VerdictOnNoMatch>");
                    sb.AppendLine(@"      <ResultRegularExpressionPattern>");
                    sb.AppendLine(@"        <Value>(.*)</Value>");
                    sb.AppendLine(@"        <IsEnabled>false</IsEnabled>");
                    sb.AppendLine(@"      </ResultRegularExpressionPattern>");
                    sb.AppendLine(@"      <ResultName>Regex Result</ResultName>");
                    sb.AppendLine(@"      <Behavior>GroupsAsDimensions</Behavior>");
                    sb.AppendLine(@"      <DimensionTitles></DimensionTitles>");
                    sb.AppendLine(@"      <Name Metadata=""Step Name"">" + cmd.command + @"</Name>");
                    sb.AppendLine(@"      <ChildTestSteps />");
                    sb.AppendLine(@"    </TestStep>");
                }

                sb.AppendLine("  </Steps>");
                sb.AppendLine(@"  <Package.Dependencies>");
                sb.AppendLine(@"    <Package Name=""OpenTAP"" Version=""^9.28.2+504225fd"" />");
                sb.AppendLine(@"  </Package.Dependencies>");
                sb.AppendLine("</TestPlan>");

                string xmlContent = sb.ToString();

                System.Diagnostics.Debug.WriteLine("[KeysightGPTPanel] Saving TAP Plan content:");
                System.Diagnostics.Debug.WriteLine(xmlContent);

                System.IO.File.WriteAllText(path, xmlContent);
                System.Diagnostics.Debug.WriteLine($"[KeysightGPTPanel] TestPlan saved: {path}");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[KeysightGPTPanel] Failed to save TestPlan: {ex.Message}");
            }
        }
    }

        // SCPI model
        public class ScpiCommand
    {
        public string command { get; set; }
        public string type { get; set; }
        public int order { get; set; }
    }

    public class ScpiCommandBlock
    {
        public System.Collections.Generic.List<ScpiCommand> commands { get; set; }
    }
}
