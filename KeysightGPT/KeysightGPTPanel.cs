using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using Microsoft.Web.WebView2.Wpf;
using Newtonsoft.Json;
using OpenTap.Plugins.BasicSteps;
using Keysight.OpenTap.Wpf;
using Keysight.OpenTap.Gui;
using OpenTap;

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

        private static readonly global::OpenTap.TraceSource Log = global::OpenTap.Log.CreateSource("Your Source Name");


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

            Log.Info("[KeysightGPT] Waiting for backend to become available...");
            bool backendReady = await WaitForBackendAsync("http://localhost:9000/health");

            if (!backendReady)
            {
                Log.Info("[KeysightGPT] Backend failed to start within timeout.");
                return;
            }

            Log.Info("[KeysightGPT] Waiting for frontend to become available...");
            bool frontendReady = await WaitForFrontendAsync("http://localhost:3000");

            if (!frontendReady)
            {
                Log.Info("[KeysightGPT] Frontend failed to start within timeout.");
                return;
            }

            webView.Source = new Uri("http://localhost:3000");
            webView.WebMessageReceived += OnWebMessageReceived;

            Log.Info("[KeysightGPTPanel] WebView navigated to localhost:3000.");

            this.Unloaded += (s, e) => Dispose();
        }

        private async Task<bool> WaitForBackendAsync(string url, int timeoutMs = 300000)
        {
            var sw = Stopwatch.StartNew();

            while (sw.ElapsedMilliseconds < timeoutMs)
            {
                try
                {
                    var request = System.Net.WebRequest.Create(url);
                    request.Timeout = 300000;

                    using (var response = await request.GetResponseAsync())
                    {
                        return true;
                    }
                }
                catch
                {
                    await Task.Delay(500);
                }
            }

            return false;
        }

        private async Task<bool> WaitForFrontendAsync(string url, int timeoutMs = 300000)
        {
            var sw = Stopwatch.StartNew();

            while (sw.ElapsedMilliseconds < timeoutMs)
            {
                try
                {
                    var request = System.Net.WebRequest.Create(url);
                    request.Timeout = 300000;

                    using (var response = await request.GetResponseAsync())
                    {
                        return true;
                    }
                }
                catch
                {
                    await Task.Delay(500);
                }
            }

            return false;
        }

        private bool IsPortOpen(int port)
        {
            var props = System.Net.NetworkInformation.IPGlobalProperties.GetIPGlobalProperties();
            var listeners = props.GetActiveTcpListeners();

            foreach (var ep in listeners)
            {
                if (ep.Port == port)
                    return true;
            }

            return false;
        }

        private void StartWebServices()
        {
            string pluginDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            string opentapRoot = Directory.GetParent(pluginDir).Parent.FullName;
            string backendDir = Path.Combine(opentapRoot, "backend");
            string frontendDir = Path.Combine(opentapRoot, "frontend");

            string frontendMarker = Path.Combine(frontendDir, ".frontend_installed");

            if (!File.Exists(frontendMarker))
            {
                Log.Info("[KeysightGPT] Installing frontend dependencies (one-time)...");

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
                Log.Info("[KeysightGPT] Installing backend dependencies (one-time)...");

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

            if (!IsPortOpen(9000))
            {
                LaunchProcess("cmd.exe", "/c uvicorn app.main:app --port 9000", backendDir);
            }
            else
            {
                Log.Info("[KeysightGPT] Backend already running.");
            }

            if (!IsPortOpen(3000))
            {
                LaunchProcess("cmd.exe", "/c npm start", frontendDir,
                    new Dictionary<string, string> { { "BROWSER", "none" } });
            }
            else
            {
                Log.Info("[KeysightGPT] Frontend already running.");
            }
        }

        private void LaunchProcess(string fileName, string args, string workingDir, Dictionary<string, string> env = null)
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = args,
                WorkingDirectory = workingDir,
                CreateNoWindow = false,
                UseShellExecute = false
            };

            if (env != null)
            {
                foreach (var item in env)
                    startInfo.EnvironmentVariables[item.Key] = item.Value;
            }

            var proc = Process.Start(startInfo);
            if (proc != null)
                _managedProcesses.Add(proc);
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
                Log.Info("[Panel] WebMessage error: " + ex.Message);
            }
        }

        public void ApplyCommandsToTestPlan(ScpiCommandBlock block)
        {
            try
            {
                var plan = _context.Plan;
                if (plan == null || block?.commands == null)
                    return;

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
                Log.Info("[Panel] Apply Error: " + ex.Message);
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
                        var killer = Process.Start(new ProcessStartInfo
                        {
                            FileName = "taskkill",
                            Arguments = $"/T /F /PID {proc.Id}",
                            CreateNoWindow = false,
                            UseShellExecute = false
                        });

                        killer?.WaitForExit(2000);
                    }
                }
                catch
                {
                }
                finally
                {
                    proc.Dispose();
                }
            }

            _managedProcesses.Clear();
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
        public List<ScpiCommand> commands { get; set; }
    }
}
