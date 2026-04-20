import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/id";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

const DEFAULT_TZ = "Asia/Jakarta";

export const dateUtils = {
  formatNow: (format = "DD-MM-YYYY HH:mm:ss") => {
    return dayjs().tz(DEFAULT_TZ).format(format);
  },

  fromUnix: (timestamp: number, format = "DD MMMM YYYY, HH:mm") => {
    return dayjs.unix(timestamp).tz(DEFAULT_TZ).format(format);
  },

  now: () => dayjs().tz(DEFAULT_TZ),

  isExpired: (expiryTimestamp: number) => {
    return dayjs().isAfter(dayjs.unix(expiryTimestamp));
  },
};
