using OpenTap;
using Keysight.OpenTap.Wpf;
using System.Windows;              // FrameworkElement

[assembly: Display("KeysightGPT Panel", Group: "KeysightGPT", Description: "Custom UI Panel")]

namespace KeysightGPT
{
    [Display("KeysightGPT Panel")]
    public class KeysightGPTPanelPlugin : ITapDockMultiPanel
    {
        public string Title => "KeysightGPT Panel";

        // nullable doubles, per ITapDockPanel definition
        public double? DesiredWidth => null;   // null = auto-size
        public double? DesiredHeight => null;  // null = auto-size

        public void Dispose()
        {
            // cleanup if needed
        }

        public FrameworkElement CreateElement(ITapDockContext context)
        {
            return new KeysightGPTPanel(); // Your custom WPF panel
        }
    }
}
