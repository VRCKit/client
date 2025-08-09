using System;
using System.Runtime.InteropServices;
using System.Threading;

namespace VRCKitSystemLayer
{
    public class SystemInactivityDetector
    {
        // P/Invoke için gerekli yapılar ve fonksiyonlar
        [StructLayout(LayoutKind.Sequential)]
        private struct LASTINPUTINFO
        {
            public uint cbSize;
            public uint dwTime;
        }

        [DllImport("user32.dll")]
        private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern uint GetTickCount();

        private Timer _detectionTimer;
        private TimeSpan _inactivityThreshold;
        private bool _isUserInactive = false;

        public event EventHandler UserBecameInactive;

        public event EventHandler UserBecameActive;

        public SystemInactivityDetector(TimeSpan threshold)
        {
            _inactivityThreshold = threshold;
        }

        public void StartDetection()
        {
            _detectionTimer = new Timer(CheckInactivity, null, 0, 1000);
            UserBecameActive?.Invoke(this, EventArgs.Empty);
        }

        private uint GetLastInputTime()
        {
            LASTINPUTINFO lii = new LASTINPUTINFO();
            lii.cbSize = (uint)Marshal.SizeOf(typeof(LASTINPUTINFO));
            if (GetLastInputInfo(ref lii))
            {
                return lii.dwTime;
            }
            return 0;
        }

        private void CheckInactivity(object state)
        {
            uint currentTime = GetTickCount();
            uint lastInputTick = GetLastInputTime();
            uint idleTimeMs = currentTime - lastInputTick;

            TimeSpan currentIdleTime = TimeSpan.FromMilliseconds(idleTimeMs);

            if (currentIdleTime >= _inactivityThreshold)
            {
                if (!_isUserInactive)
                {
                    _isUserInactive = true;
                    UserBecameInactive?.Invoke(this, EventArgs.Empty);
                }
            }
            else
            {
                if (_isUserInactive)
                {
                    _isUserInactive = false;
                    UserBecameActive?.Invoke(this, EventArgs.Empty);
                }
            }
        }

        public void StopDetection()
        {
            _detectionTimer?.Dispose();
        }

        public bool IsUserInactive
        {
            get { return _isUserInactive; }
        }

        public TimeSpan InactivityThreshold
        {
            get { return _inactivityThreshold; }
            set
            {
                _inactivityThreshold = value;
                if (_detectionTimer != null)
                {
                    _detectionTimer.Change(0, 1000);
                }
            }
        }
    }
}
