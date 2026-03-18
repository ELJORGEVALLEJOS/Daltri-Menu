export const OPENING_HOURS_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const OPENING_HOURS_DAYS = [
    { key: 'monday', label: 'Lunes', shortLabel: 'Lun' },
    { key: 'tuesday', label: 'Martes', shortLabel: 'Mar' },
    { key: 'wednesday', label: 'Miércoles', shortLabel: 'Mié' },
    { key: 'thursday', label: 'Jueves', shortLabel: 'Jue' },
    { key: 'friday', label: 'Viernes', shortLabel: 'Vie' },
    { key: 'saturday', label: 'Sábado', shortLabel: 'Sáb' },
    { key: 'sunday', label: 'Domingo', shortLabel: 'Dom' },
] as const;

export type OpeningHoursDayKey = (typeof OPENING_HOURS_DAYS)[number]['key'];

export type OpeningHoursDayConfig = {
    enabled: boolean;
    open: string;
    close: string;
};

export type MerchantOpeningHours = Record<OpeningHoursDayKey, OpeningHoursDayConfig>;

const DEFAULT_OPENING_HOUR = {
    enabled: false,
    open: '09:00',
    close: '18:00',
} as const;

const WEEKDAY_TO_KEY: Record<string, OpeningHoursDayKey> = {
    monday: 'monday',
    tuesday: 'tuesday',
    wednesday: 'wednesday',
    thursday: 'thursday',
    friday: 'friday',
    saturday: 'saturday',
    sunday: 'sunday',
};

function isValidTime(value: unknown): value is string {
    return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

function toMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
}

export function buildDefaultOpeningHours(): MerchantOpeningHours {
    return OPENING_HOURS_DAYS.reduce((acc, day) => {
        acc[day.key] = { ...DEFAULT_OPENING_HOUR };
        return acc;
    }, {} as MerchantOpeningHours);
}

export function normalizeOpeningHours(input?: unknown): MerchantOpeningHours {
    const normalized = buildDefaultOpeningHours();

    if (!input || Array.isArray(input) || typeof input !== 'object') {
        return normalized;
    }

    const record = input as Record<string, unknown>;
    for (const day of OPENING_HOURS_DAYS) {
        const rawDay = record[day.key];
        if (!rawDay || Array.isArray(rawDay) || typeof rawDay !== 'object') {
            continue;
        }

        const dayRecord = rawDay as Record<string, unknown>;
        const open = isValidTime(dayRecord.open) ? dayRecord.open.trim() : DEFAULT_OPENING_HOUR.open;
        const close = isValidTime(dayRecord.close) ? dayRecord.close.trim() : DEFAULT_OPENING_HOUR.close;

        normalized[day.key] = {
            enabled: dayRecord.enabled === true,
            open,
            close,
        };
    }

    return normalized;
}

export function formatOpeningHoursRange(day: OpeningHoursDayConfig) {
    return day.enabled ? `${day.open} - ${day.close}` : 'Cerrado';
}

export function getOpeningHoursStatus(
    openingHours?: MerchantOpeningHours | null,
    now: Date = new Date(),
    timeZone: string = OPENING_HOURS_TIMEZONE,
) {
    const normalized = normalizeOpeningHours(openingHours);
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone,
    });
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone,
    });

    const weekday = weekdayFormatter.format(now).toLowerCase();
    const dayKey = WEEKDAY_TO_KEY[weekday];
    const currentTime = timeFormatter.format(now);
    const currentMinutes = toMinutes(currentTime);
    const currentDay = dayKey ? normalized[dayKey] : null;
    const isOpenNow = currentDay
        ? currentDay.enabled &&
          toMinutes(currentDay.open) <= currentMinutes &&
          currentMinutes <= toMinutes(currentDay.close)
        : false;
    const hasAnyEnabledDay = OPENING_HOURS_DAYS.some((day) => normalized[day.key].enabled);
    const todayMeta = OPENING_HOURS_DAYS.find((day) => day.key === dayKey) || null;

    return {
        isOpenNow,
        hasAnyEnabledDay,
        todayKey: dayKey,
        todayLabel: todayMeta?.label || 'Hoy',
        todayRangeLabel: currentDay ? formatOpeningHoursRange(currentDay) : 'Cerrado',
    };
}
