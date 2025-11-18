//using System;
//using System.Collections.Generic;
//using System.Diagnostics;
//using System.IO;
//using Newtonsoft.Json;
//using OpenTap;

//namespace KeysightGPT
//{
//    // SCPI command model
//    public class ScpiCommand
//    {
//        public string command { get; set; }
//        public string type { get; set; }
//        public int order { get; set; }
//    }

//    public class ScpiCommandBlock
//    {
//        public List<ScpiCommand> commands { get; set; }
//    }

//    [Display("SCPI Step")]
//    public class ScpiStep : TestStep
//    {
//        private readonly string command;

//        public ScpiStep(string command)
//        {
//            this.command = command;
//            this.Name = $"SCPI: {command}";
//        }

//        public override void Run()
//        {
//            Log.Info($"Executing SCPI command: {command}");
//        }
//    }

//    public static class TapPlanGenerator
//    {
//        public static void SaveJsonAsTestPlan(string json, string path = null)
//        {
//            if (string.IsNullOrWhiteSpace(json)) return;

//            try
//            {
//                var block = JsonConvert.DeserializeObject<ScpiCommandBlock>(json);
//                if (block?.commands == null || block.commands.Count == 0) return;

//                var plan = new TestPlan(); // Editor CE version

//                foreach (var cmd in block.commands)
//                    plan.AddTestStep(new ScpiStep(cmd.command));

//                if (string.IsNullOrEmpty(path))
//                    path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "WebViewTestPlan.tap");

//                plan.Save(path);
//                Debug.WriteLine($"[TapPlanGenerator] TestPlan saved: {path}");
//            }
//            catch (Exception ex)
//            {
//                Debug.WriteLine($"[TapPlanGenerator] Failed to save TestPlan: {ex.Message}");
//            }
//        }

//        public static TestPlan LoadTestPlan(string path)
//        {
//            if (!File.Exists(path)) return null;

//            try
//            {
//                var plan = TestPlan.Load(path);
//                Debug.WriteLine($"[TapPlanGenerator] TestPlan loaded: {path}");
//                return plan;
//            }
//            catch (Exception ex)
//            {
//                Debug.WriteLine($"[TapPlanGenerator] Failed to load TestPlan: {ex.Message}");
//                return null;
//            }
//        }
//    }
//}
