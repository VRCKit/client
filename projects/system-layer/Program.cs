using System;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using VRCKitSystemLayer;
using WindowsMediaController;

class Program
{
    static JsonSerializerOptions jsonOptions = new JsonSerializerOptions
    {
        Converters = { new JsonStringEnumConverter() }
    };
    static async Task Main()
    {
        var mediaManager = new MediaManager();
        var inactivityDetector = new SystemInactivityDetector(TimeSpan.FromMinutes(15));

        mediaManager.OnAnyMediaPropertyChanged += (sender, args) =>
        {
            Console.WriteLine(JsonSerializer.Serialize(new
            {
                Type = "PlaybackPropertyInfo",
                Data = new
                {
                    Id = sender.ControlSession.SourceAppUserModelId,
                    Properties = args
                }
            }, jsonOptions));
        };

        mediaManager.OnAnySessionOpened += (sender) =>
        {
            Console.WriteLine(JsonSerializer.Serialize(new
            {
                Type = "PlaybackSessionOpened",
                Data = new
                {
                    Id = sender.ControlSession.SourceAppUserModelId
                }
            }, jsonOptions));
        };

        mediaManager.OnAnySessionClosed += (sender) =>
        {
            Console.WriteLine(JsonSerializer.Serialize(new
            {
                Type = "PlaybackSessionClosed",
                Data = new
                {
                    Id = sender.ControlSession.SourceAppUserModelId
                }
            }, jsonOptions));
        };


        mediaManager.OnAnyTimelinePropertyChanged += (sender, args) =>
        {

            TimeSpan TotalTime = args.EndTime - args.StartTime;

            Console.WriteLine(JsonSerializer.Serialize(new
            {
                Type = "PlaybackPositionInfo",
                Data = new
                {
                    Id = sender.ControlSession.SourceAppUserModelId,
                    Properties = new
                    {
                        CurrentTime = args.Position.TotalMilliseconds,
                        TotalTime = TotalTime.TotalMilliseconds,
                    }
                }
            }, jsonOptions));
        };

        mediaManager.OnFocusedSessionChanged += (sender) =>
        {

            Console.WriteLine(JsonSerializer.Serialize(new
            {
                Type = "PlaybackSessionFocused",
                Data = new
                {
                    Id = sender?.ControlSession?.SourceAppUserModelId
                }
            }, jsonOptions));
        };

        mediaManager.OnAnyPlaybackStateChanged += (sender, args) =>
        {

            Console.WriteLine(JsonSerializer.Serialize(new
            {
                Type = "PlaybackStateInfo",
                Data = new
                {
                    Id = sender.ControlSession.SourceAppUserModelId,
                    Properties = args
                }
            }, jsonOptions));
        };

        inactivityDetector.UserBecameActive += (sender, args) =>
        {
            Console.WriteLine(JsonSerializer.Serialize(new
            {
                Type = "UserBecameActive",
                Data = new
                {
                    Time = DateTime.Now
                }
            }, jsonOptions));
        };

        inactivityDetector.UserBecameInactive += (sender, args) =>
        {
            Console.WriteLine(JsonSerializer.Serialize(new
            {
                Type = "UserBecameInactive",
                Data = new
                {
                    Time = DateTime.Now
                }
            }, jsonOptions));
        };

        _ = Task.Run(() =>
        {
            while (true)
            {
                try
                {
                    string jsonInput = Console.ReadLine()!;

                    using (JsonDocument doc = JsonDocument.Parse(jsonInput))
                    {
                        var updateType = doc.RootElement.GetProperty("Type").GetString();
                        var updateData = doc.RootElement.GetProperty("Data");

                        switch (updateType)
                        {
                            case "InactivityThreshold":
                                {
                                    if (updateData.TryGetInt64(out var newThreshold))
                                    {
                                        inactivityDetector.InactivityThreshold = TimeSpan.FromMilliseconds(newThreshold);
                                    }
                                    break;
                                }
                        }
                    }
                }
                catch (JsonException ex)
                {
                    Console.WriteLine(ex.ToString());
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.ToString());
                }
            }
        });


        inactivityDetector.StartDetection();
        _ = mediaManager.StartAsync();
        await Task.Delay(-1);
    }
}
