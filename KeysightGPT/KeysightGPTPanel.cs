using System;
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
            webView = new WebView2();

            Content = webView;  // attach WebView2 into the UserControl

            await webView.EnsureCoreWebView2Async();

            webView.Source = new Uri("http://localhost:3000");

            webView.WebMessageReceived += OnWebMessageReceived;
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
