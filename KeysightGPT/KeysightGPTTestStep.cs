using Newtonsoft.Json;
using OpenTap;
using System.ComponentModel;

namespace KeysightGPT
{
    public class ScpiCommandBlock
    {
        [JsonProperty("commands")]
        public string[] Commands { get; set; }
    }
    // SCPI Step implementation inheriting from TestStep
    public class ScpiStep : TestStep
    {
        private readonly string command;
        public ScpiStep(string command)
        {
            this.command = command;
            this.Name = $"SCPI: {command}";
        }
        public override void Run()
        {
            // Implement the logic to send the SCPI command here 
            // For now, just log the command
            Log.Info($"Executing SCPI command: {command}");
        }
    }
    [Display("KeysightGPT TestStep", Description: "Receives SCPI commands and inserts them as child steps.", Group: "KeysightGPT")]

    // In KeysightGPTTestStep.cs, add a static Instance property to implement the singleton pattern.
    public class KeysightGPTTestStep : TestStep
    {
        private static readonly KeysightGPTTestStep _instance = new KeysightGPTTestStep();
        public static KeysightGPTTestStep Instance => _instance;

        [Display("SCPI Commands JSON", "Paste or receive SCPI commands as a JSON array, e.g. { \"commands\": [\"*RST\", \"VOLT 5\", \"MEAS:VOLT?\"] }", Order: 1)]
        [Browsable(true)]
        public string ScpiCommandsJson { get; set; }
        public KeysightGPTTestStep()
        {
            ScpiCommandsJson = "{ \"commands\": [\"*RST\", \"VOLT 5\", \"MEAS:VOLT?\"] }";
        }
        public override void PrePlanRun()
        {
            base.PrePlanRun();
            if (!string.IsNullOrWhiteSpace(ScpiCommandsJson))
            {
                try
                {
                    var block = JsonConvert.DeserializeObject<ScpiCommandBlock>(ScpiCommandsJson);
                    if (block?.Commands != null)
                    {
                        foreach (var cmd in block.Commands)
                        {
                            this.ChildTestSteps.Add(new ScpiStep(cmd));
                        }
                    }
                }
                catch
                {
                    Log.Error("Failed to parse SCPI commands JSON.");
                }
            }
        }
        public override void Run()
        {
            RunChildSteps();
            UpgradeVerdict(Verdict.Pass);
        }
        public override void PostPlanRun()
        {
            base.PostPlanRun();
        }
    }
}
