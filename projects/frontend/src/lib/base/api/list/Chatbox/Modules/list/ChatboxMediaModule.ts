/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";
import formatSeconds from "stuffs/lib/formatSeconds";

type Session = {
  id: string;
  closed_at?: number;
  focused_at?: number;
  updated_at: number;
  properties: {
    title: string;
    artist: string;
    album_title: string;
  };
  playback: {
    status: "Playing" | "Paused" | "Stopped";
    current_time: number;
    total_time: number;
  }
}

const SyncedLyricRegex = /^\[([^\]]+)\](.*)/gm;

type LyricData = {
  id: string;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  insturmental: boolean;
  plainLyrics: string;
  syncedLyrics?: string;
  parsedSyncedLyrics?: { at: number, text: string }[];
}

export class ChatboxMediaModule extends ChatboxModule {
  static SessionCloseTimeout = 60000;
  static DefaultSession: Session = Object.freeze({
    id: "Default",
    updated_at: 0,
    properties: {
      title: "Unknown",
      artist: "Unknown",
      album_title: "Unknown"
    },
    playback: {
      status: "Stopped",
      current_time: 0,
      total_time: 0
    }
  } as Session);

  sessions: Map<string, Session> = new Map();
  currentSessionId: string | null = null;
  currentLyric: LyricData | null = null;
  lastLyricKey: string | null = null;
  sessionCheckerInterval: any = null;

  constructor(public modules: Modules) {
    super(modules, "media", "Media", {
      description: "Media module, used to display media information.",
      inputs: [
        {
          type: "KeyValues",
          id: "playback_status_text",
          name: "Playback Status Text",
          default_value: {
            Stopped: "⏹️",
            Playing: "▶️",
            Paused: "⏸️"
          },
          allow_custom_keys: false
        },
        {
          type: "KeyValues",
          id: "lyric_info_text",
          name: "Lyric Info Text",
          default_value: {
            no_lyrics_found: "No lyrics found.",
            insturmental: "Instrumental",
            clear_line: ""
          },
          key_display_names: {
            no_lyrics_found: "No Lyrics Found",
            insturmental: "Insturmental",
            clear_line: "Clear Line"
          },
          allow_custom_keys: false
        },
      ],
      example_placeholders: [
        {
          placeholder: "playback_status",
          description: "Playback status of the media that formatted by the config."
        },
        {
          placeholder: "title",
          description: "Title of the media."
        },
        {
          placeholder: "artist",
          description: "Artist of the media."
        },
        {
          placeholder: "current_time",
          description: "Current time of the media formatted as mm:ss."
        },
        {
          placeholder: "total_time",
          description: "Total time of the media formatted as mm:ss."
        },
        {
          placeholder: "current_lyric_line",
          description: "Show the current line of the lyric."
        },
        {
          placeholder: "session_id",
          description: "ID of the media is from."
        },
        {
          placeholder: "raw_current_time",
          description: "Current time of the media in raw format."
        },
        {
          placeholder: "raw_total_time",
          description: "Total time of the media in raw format."
        },
        {
          placeholder: "raw_playback_status",
          description: "Playback status of the media in raw format."
        },
        {
          placeholder: "raw_session_id",
          description: "ID of the media is from in raw format."
        }
      ]
    });
  }

  async handleSystemLayerMessage({ Type, Data }: { Type: string, Data: any }) {
    switch (Type) {
      case "PlaybackSessionOpened": {
        if (!this.sessions.has(Data.Id)) {
          this.sessions.set(Data.Id, {
            id: Data.Id,
            updated_at: Date.now(),
            properties: {
              title: "",
              artist: "",
              album_title: ""
            },
            playback: {
              status: "Stopped",
              current_time: 0,
              total_time: 0
            }
          });
        } else {
          const session = this.sessions.get(Data.Id);
          if (!session) return;
          session.updated_at = Date.now();
          session.closed_at = undefined;
        }
        break;
      }
      case "PlaybackSessionClosed": {
        const session = this.sessions.get(Data.Id);
        if (!session) return;
        session.updated_at = Date.now();
        session.closed_at = Date.now();
        this.currentSessionId = null;
        break;
      }
      case "PlaybackSessionFocused": {
        const session = this.sessions.get(Data.Id);
        if (!session) return;
        session.updated_at = Date.now();
        session.focused_at = Date.now();
        this.currentSessionId = Data.Id;
        break;
      }
      case "PlaybackPropertyInfo": {
        const session = this.sessions.get(Data.Id);
        if (!session) return;
        session.updated_at = Date.now();
        session.properties = {
          title: Data.Properties.Title,
          artist: Data.Properties.Artist,
          album_title: Data.Properties.AlbumTitle
        };
        session.playback.status = "Playing";
        break;
      }
      case "PlaybackPositionInfo": {
        const session = this.sessions.get(Data.Id);
        if (!session) return;
        if (
          session.playback.total_time == Data.Properties.TotalTime
          && session.playback.current_time == Data.Properties.CurrentTime
        ) return;
        session.updated_at = Date.now();
        session.playback.current_time = Data.Properties.CurrentTime;
        session.playback.total_time = Data.Properties.TotalTime;
        break;
      }
      case "PlaybackStateInfo": {
        const session = this.sessions.get(Data.Id);
        if (!session) return;
        session.updated_at = Date.now();
        session.playback.status = Data.Properties.PlaybackStatus;
        break;
      }
    }
  }

  async init() {
    this.modules.chatbox.api.events.on("SystemLayerMessage", this.handleSystemLayerMessage.bind(this));

    this.sessionCheckerInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.sessions) {
        if (session.closed_at) {
          if (now - session.closed_at > ChatboxMediaModule.SessionCloseTimeout) {
            this.sessions.delete(id);
          }
        }
      }
    }, 5000);

    {
      const lyrics = (await this.modules.chatbox.api.database.keyValues.get<Record<string, any>>("ChatboxMediaModule;LyricsCache", {}))!
      for (const key in lyrics) {
        if (lyrics[key].at < Date.now() - 1000 * 60 * 60 * 24 * 2) {
          delete lyrics[key];
        }
      }
      await this.modules.chatbox.api.database.keyValues.set("ChatboxMediaModule;LyricsCache", lyrics);
    }
  }

  async destroy() {
    this.modules.chatbox.api.events.off("SystemLayerMessage", this.handleSystemLayerMessage.bind(this));
    clearInterval(this.sessionCheckerInterval);
  }

  async fetchCurrentLyric() {
    const session = this.getActiveSession();
    if (!session) return null;
    const cacheKey = `${session.properties.title};${session.properties.artist};${(session.playback.total_time / 1000).toFixed(2)}`;
    if (this.lastLyricKey === cacheKey) return this.currentLyric;
    this.lastLyricKey = cacheKey;
    this.currentLyric = await this.fetchLyrics(session.properties.title, session.properties.artist, session.playback.total_time / 1000);
    return this.currentLyric;
  }

  async getCurrentLyricLine() {
    const infoText = this.getInputValue("lyric_info_text")!;
    const lyric = await this.fetchCurrentLyric();
    const session = this.getActiveSession();
    if (!session || session.playback.status !== "Playing") return infoText.no_lyrics_found;
    if (!lyric || !lyric.parsedSyncedLyrics) return infoText.no_lyrics_found;
    if (lyric.insturmental) return infoText.insturmental;
    const currentTime = session.playback.current_time;
    const currentLine = lyric.parsedSyncedLyrics.find(
      (l) => l.at >= currentTime
    );
    if (!currentLine) return infoText.clear_line;
    return currentLine.text || infoText.clear_line;
  }

  async fetchLyrics(trackName: string, artistName: string, duration: number): Promise<LyricData | null> {
    const cacheKey = `${trackName};${artistName};${duration.toFixed(2)}`;
    const cache = (await this.modules.chatbox.api.database.keyValues.get<Record<string, any>>("ChatboxMediaModule;LyricsCache", {}))!;
    const cached = cache[cacheKey];
    if (!cached || Date.now() - cached.at > 1000 * 60 * 60 * 24 * 2) {
      const res = await this.modules.chatbox.api.http.fetch({
        url: `https://lrclib.net/api/get?${new URLSearchParams({
          track_name: trackName,
          artist_name: artistName,
          duration: duration.toFixed(2),
        }).toString()}`,
        side: "Client"
      });
      if (res.status === 200) {
        const data = res.data as LyricData;
        if (data.syncedLyrics) {
          const matches = [...data.syncedLyrics.matchAll(SyncedLyricRegex)];
          data.parsedSyncedLyrics = matches.map(i => {
            const time = i[1].split(":").map(i => parseFloat(i));
            return {
              at: time[0] * 60 * 1000 + time[1] * 1000 + (time[2] || 0),
              text: i[2].trim()
            }
          });
        }
        cache[cacheKey] = {
          at: Date.now(),
          data
        }
      } else {
        cache[cacheKey] = {
          at: Date.now(),
          data: null
        }
      }
    }
    return cache[cacheKey].data || null;
  }

  getActiveSession() {
    const now = Date.now();
    const sessions = [...this.sessions.values()];
    const filteredSessions = sessions
      .filter(i => !i.closed_at);
    return filteredSessions.filter(i => now - i.updated_at < ChatboxMediaModule.SessionCloseTimeout)
      .sort((a, b) => b.updated_at - a.updated_at)[0]
      || filteredSessions.find(i => i.playback?.status === "Playing")
      || filteredSessions.find(i => i.focused_at)
      || sessions[0];
  }

  async getPlaceholder(key: string): Promise<string> {
    let session = this.getActiveSession();
    if (!session) session = ChatboxMediaModule.DefaultSession;
    switch (key) {
      case "artist": return session.properties.artist;
      case "album_title": return session.properties.album_title;
      case "title": return session.properties.title;
      case "raw_current_time": return session.playback.current_time.toString();
      case "raw_total_time": return session.playback.total_time.toString();
      case "raw_playback_status": return session.playback.status;
      case "current_time": {
        return formatSeconds(session.playback.current_time / 1000);
      }
      case "total_time": {
        return formatSeconds(session.playback.total_time / 1000);
      }
      case "playback_status": {
        return this.getInputValue("playback_status_text")?.[session.playback.status]
          || session.playback.status;
      }
      case "raw_session_id": return session.id;
      case "session_id": {
        if (session.id.includes("!")) return session.id.split("!")[1];
        return session.id;
      }
      case "current_lyric_line": return await this.getCurrentLyricLine();
      default: return key;
    }
  }
}