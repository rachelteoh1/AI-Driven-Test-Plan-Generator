using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Microsoft.Web.WebView2.Wpf;
using Newtonsoft.Json;
using OpenTap.Plugins.BasicSteps;
using Keysight.OpenTap.Wpf;
using Keysight.OpenTap.Gui;

namespace KeysightGPT
{
        public class KeysightGPTPanel : UserControl, IDisposable
        {
            private readonly ITapDockContext _context;
            private WebView2 webView;
            private readonly List<Process> _managedProcesses = new List<Process>();

            public KeysightGPTPanel(ITapDockContext context)
            {
                _context = context;
                InitializeWebView();
            }

            private async void InitializeWebView()
            {
                StartWebServices();

                webView = new WebView2
                {
                    HorizontalAlignment = HorizontalAlignment.Stretch,
                    VerticalAlignment = VerticalAlignment.Stretch
                };

                var grid = new Grid();
                grid.Children.Add(webView);
                Content = grid;

                await webView.EnsureCoreWebView2Async();

                Debug.WriteLine("[KeysightGPT] Waiting for React dev server to boot...");
            await Task.Delay(15000);

                webView.Source = new Uri("http://localhost:3000");
                webView.WebMessageReceived += OnWebMessageReceived;

                Debug.WriteLine("[KeysightGPTPanel] WebView navigated to localhost:3000.");

                this.Unloaded += (s, e) => Dispose();
            }

        private void StartWebServices()
        {
            string pluginDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            string backendDir = Path.Combine(pluginDir, "backend");
            string frontendDir = Path.Combine(pluginDir, "frontend");

            string frontendMarker = Path.Combine(frontendDir, ".frontend_installed");

            if (!File.Exists(frontendMarker))
            {
                Debug.WriteLine("[KeysightGPT] Installing frontend dependencies (one-time)...");
                var installProc = Process.Start(new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c npm install",
                    WorkingDirectory = frontendDir,
                    CreateNoWindow = false
                });
                installProc?.WaitForExit();

                File.WriteAllText(frontendMarker, "ok");
            }

            string backendMarker = Path.Combine(backendDir, ".backend_installed");

            if (!File.Exists(backendMarker))
            {
                Debug.WriteLine("[KeysightGPT] Installing backend dependencies (one-time)...");
                var pipProc = Process.Start(new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c python -m pip install -r requirements.txt",
                    WorkingDirectory = backendDir,
                    CreateNoWindow = false
                });
                pipProc?.WaitForExit();

                File.WriteAllText(backendMarker, "ok");
            }

            LaunchProcess("cmd.exe", "/c uvicorn app.main:app --reload", backendDir);
            LaunchProcess("cmd.exe", "/c npm start", frontendDir, new Dictionary<string, string> { { "BROWSER", "none" } });
        }


        private void LaunchProcess(string fileName, string args, string workingDir, Dictionary<string, string> env = null)
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = args,
                    WorkingDirectory = workingDir,
                    CreateNoWindow = true, // Set to false temporarily if you need to debug errors
                    UseShellExecute = false
                };

                if (env != null)
                {
                    foreach (var item in env)
                        startInfo.EnvironmentVariables[item.Key] = item.Value;
                }

                var proc = Process.Start(startInfo);
                if (proc != null) _managedProcesses.Add(proc);
            }

            private void OnWebMessageReceived(object sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var rawJson = e.WebMessageAsJson;
                var unwrappedJson = JsonConvert.DeserializeObject<string>(rawJson);
                var block = JsonConvert.DeserializeObject<ScpiCommandBlock>(unwrappedJson);

                if (block != null)
                {
                    GuiHelpers.GuiInvoke(() => ApplyCommandsToTestPlan(block));
                }
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
                var plan = _context.Plan;
                if (plan == null || block?.commands == null) return;

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
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine("[Panel] Apply Error: " + ex.Message);
            }
        }

        public void Dispose()
        {
            foreach (var proc in _managedProcesses)
            {
                try
                {
                    if (!proc.HasExited)
                    {
                        // Kill the process tree (kills cmd.exe and the child node/python process)
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = "taskkill",
                            Arguments = $"/T /F /PID {proc.Id}",
                            CreateNoWindow = true,
                            UseShellExecute = false
                        });
                    }
                }
                catch { /* Ignore cleanup errors */ }
            }
            _managedProcesses.Clear();
        }
    }

    public class ScpiCommand { public string command { get; set; } public string type { get; set; } public int order { get; set; } }
    public class ScpiCommandBlock { public List<ScpiCommand> commands { get; set; } }
}
