using System;
using System.Windows;
using System.Windows.Controls;
using Microsoft.Web.WebView2.Wpf;   // WPF WebView2
using Microsoft.Web.WebView2.Core;

namespace KeysightGPT
{
    public class KeysightGPTPanel : UserControl
    {
        private WebView2 webView;

        public KeysightGPTPanel()
        {
            Initialize();
        }

        private async void Initialize()
        {
            try
            {
                webView = new WebView2
                {
                    HorizontalAlignment = HorizontalAlignment.Stretch,
                    VerticalAlignment = VerticalAlignment.Stretch
                };

                // Wrap in a Grid so it always expands
                var grid = new Grid();
                grid.Children.Add(webView);
                Content = grid;

                // Try to init WebView2
                await webView.EnsureCoreWebView2Async();

                // Once ready, set source
                webView.Source = new Uri("http://localhost:3000");

                // Handle messages (optional)
                webView.WebMessageReceived += OnWebMessageReceived;
            }
            catch (Exception ex)
            {
                // If initialization fails, show error in UI instead of blank white
                Content = new TextBlock
                {
                    Text = "WebView2 failed: " + ex.Message,
                    Foreground = System.Windows.Media.Brushes.Red,
                    Margin = new Thickness(10)
                };
            }
        }

        private void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            var json = e.WebMessageAsJson;

            var testStep = KeysightGPTTestStep.Instance;
            if (testStep != null)
            {
                testStep.ScpiCommandsJson = json;
            }
        }
    }
}
