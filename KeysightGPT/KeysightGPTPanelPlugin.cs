using OpenTap;
using Keysight.OpenTap.Wpf;
using System.Windows;

[assembly: Display("KeysightGPT Panel", Group: "KeysightGPT")]

namespace KeysightGPT
{
    [Display("KeysightGPT Panel")]
    public class KeysightGPTPanelPlugin : ITapDockMultiPanel
    {
        public string Title => "KeysightGPT Panel";
        public double? DesiredWidth => null;
        public double? DesiredHeight => null;


        public void Dispose() { }

        public FrameworkElement CreateElement(ITapDockContext context)
        {
            return new KeysightGPTPanel(context); // no arguments
        }
    }
}
