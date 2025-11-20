using System;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using Microsoft.Web.WebView2.Wpf;
using Newtonsoft.Json;
using OpenTap.Plugins.BasicSteps;
using Keysight.OpenTap.Wpf;
using Keysight.OpenTap.Gui;


namespace KeysightGPT
{
    public class KeysightGPTPanel : UserControl
    {
        private readonly ITapDockContext _context;
        private WebView2 webView;

        public KeysightGPTPanel(ITapDockContext context)
        {
            _context = context;
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

            Debug.WriteLine("[KeysightGPTPanel] WebView ready and listening.");
        }

        private void OnWebMessageReceived(object sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var rawJson = e.WebMessageAsJson;
                var unwrappedJson = JsonConvert.DeserializeObject<string>(rawJson);

                Debug.WriteLine("[Panel] Received JSON (unwrap): " + unwrappedJson);

                var block = JsonConvert.DeserializeObject<ScpiCommandBlock>(unwrappedJson);

                if (block == null)
                {
                    Debug.WriteLine("[Panel] ERROR: Cannot parse SCPI block.");
                    return;
                }

                GuiHelpers.GuiInvoke(() =>
                {
                    ApplyCommandsToTestPlan(block);
                });
            }
            catch (Exception ex)
            {
                Debug.WriteLine("[Panel] WebMessage error: " + ex.Message);
            }
        }

        public void ApplyCommandsToTestPlan(ScpiCommandBlock block)
        {
            try
            {
                if (block?.commands == null || block.commands.Count == 0)
                {
                    Debug.WriteLine("[Panel] No SCPI commands in block.");
                    return;
                }

                var plan = _context.Plan;

                if (plan == null)
                {
                    Debug.WriteLine("[Panel] No active TestPlan found in context!");
                    return;
                }

                Debug.WriteLine("[Panel] Clearing existing steps...");
                plan.Steps.Clear();

                foreach (var cmd in block.commands)
                {
                    bool isQuery = cmd.command.Trim().EndsWith("?");

                    var step = new SCPIRegexStep
                    {
                        Action = isQuery ? SCPIAction.Query : SCPIAction.Command,
                        Query = cmd.command,
                        AddToLog = true,
                        Name = cmd.command
                    };

                    plan.Steps.Add(step);

                    Debug.WriteLine($"[Panel] Added Step: {cmd.command}");
                }

                Debug.WriteLine("[Panel] TestPlan updated successfully.");
            }
            catch (Exception ex)
            {
                Debug.WriteLine("[Panel] ApplyCommandsToTestPlan ERROR: " + ex.Message);
            }
        }
    }

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
