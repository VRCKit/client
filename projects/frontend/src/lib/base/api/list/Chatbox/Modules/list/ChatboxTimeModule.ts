/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatboxModule } from "../ChatboxModule";
import { format } from "date-fns";
import formatDuration from "stuffs/lib/formatDuration";
import type { Modules } from "..";

export class ChatboxTimeModule extends ChatboxModule {
  constructor(public modules: Modules) {
    super(modules, "time", "Time", {
      description: "Time module, used to format time.",
      inputs: [
        {
          id: "date_format",
          type: "Text",
          name: "Date Format",
          default_value: "HH:mm",
          help: {
            url: "https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table",
            message: "Learn more about date format symbols."
          },
          description: "You can learn more about date format symbols by clicking the help button."
        },
        {
          id: "target_time_unix",
          type: "Number",
          name: "Target Time Unix",
          description: "Target time in unix. Used to show countdown/countup.",
          default_value: 1767229200,
          help: {
            url: "https://www.epochconverter.com/",
            message: "Learn more about epoch time."
          }
        },
        {
          id: "target_time_format",
          type: "KeyValues",
          name: "Target Time Format",
          description: "Format of the target time. Make it blank to ignore that part.",
          default_value: {
            years: "year, years",
            months: "month, months",
            weeks: "week, weeks",
            days: "day, days",
            hours: "hour, hours",
            minutes: "minute, minutes",
            seconds: "second, seconds"
          },
          key_display_names: {
            years: "Years",
            months: "Months",
            weeks: "Weeks",
            days: "Days",
            hours: "Hours",
            minutes: "Minutes",
            seconds: "Seconds"
          }
        },
        {
          id: "target_time_finish_text",
          type: "Text",
          name: "Target Time Finish Text",
          description: "Text to show when the target time is reached.",
          default_value: "Time's up!"
        }
      ],
      example_placeholders: [
        {
          placeholder: "date_time",
          description: "Formatted date."
        },
        {
          placeholder: "target_time_from_now",
          description: "Countdown to the target time."
        },
        {
          placeholder: "target_time_to_now",
          description: "Countup from the target time."
        },
        {
          placeholder: "format_time_to_now;[[time]]",
          description: "Format the time to now. Replace [[time]] with a unix timestamp."
        },
        {
          placeholder: "format_time_from_now;[[time]]",
          description: "Format the time from now. Replace [[time]] with a unix timestamp."
        },
        {
          placeholder: "format_time;[[time]];[[multiplier]];[[text]]",
          description: "Format the time. Replace [[time]] with a unix timestamp, [[multiplier]] with a multiplier (e.g., 1000 for seconds to milliseconds), and [[text]] with fallback text if formatting fails."
        }
      ]
    });
  }

  async getPlaceholder(key: string, args: string[]): Promise<string> {
    const now = new Date();
    const targetTimeFormat = Object.fromEntries(
      Object.entries(
        this.getInputValue("target_time_format")
      ).map(([key, value]: any) => [key, value.trim() ? value.split(/, ?/) : null])
    ) as any;
    switch (key) {
      case "date_time": return format(now, this.getInputValue("date_format"), {
        useAdditionalDayOfYearTokens: true,
        useAdditionalWeekYearTokens: true
      });
      case "target_time_from_now": return formatDuration(
        (this.getInputValue("target_time_unix") * 1000) - now.getTime(),
        targetTimeFormat
      ) || this.getInputValue("target_time_finish_text");
      case "target_time_to_now": return formatDuration(
        now.getTime() - (this.getInputValue("target_time_unix") * 1000),
        targetTimeFormat
      ) as any || this.getInputValue("target_time_finish_text");
      case "format_time_to_now": {
        const filledArgs = await this.modules.fillTemplates(args, "[[:]]");
        const timeValue = parseInt(filledArgs[0]) || 0;
        const multiplier = parseInt(filledArgs[1]) || 1;
        return formatDuration(
          now.getTime() - (timeValue * multiplier),
          targetTimeFormat
        ) || filledArgs[2] || "";
      }
      case "format_time_from_now": {
        const filledArgs = await this.modules.fillTemplates(args, "[[:]]");
        const timeValue = parseInt(filledArgs[0]) || 0;
        const multiplier = parseInt(filledArgs[1]) || 1;
        return formatDuration(
          (timeValue * multiplier) - now.getTime(),
          targetTimeFormat
        ) || filledArgs[2] || "";
      }
      case "format_time": {
        const filledArgs = await this.modules.fillTemplates(args, "[[:]]");
        const timeValue = parseInt(filledArgs[0]) || 0;
        const multiplier = parseInt(filledArgs[1]) || 1;
        return formatDuration(
          timeValue * multiplier,
          targetTimeFormat
        ) || filledArgs[2] || "";
      }
      default: return key;
    }
  }
}