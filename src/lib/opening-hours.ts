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

export const OPENING_HOURS_MODE_OPTIONS = [
    { value: 'closed', label: 'Cerrado' },
    { value: 'continuous', label: 'Horario corrido' },
    { value: 'split', label: 'Mañana y tarde' },
] as const;

export type OpeningHoursDayKey = (typeof OPENING_HOURS_DAYS)[number]['key'];
export type OpeningHoursMode = (typeof OPENING_HOURS_MODE_OPTIONS)[number]['value'];

export type OpeningHoursDayConfig = {
    enabled: boolean;
    mode: OpeningHoursMode;
    open: string;
    close: string;
    morning_open: string;
    morning_close: string;
    afternoon_open: string;
    afternoon_close: string;
};

export type MerchantOpeningHours = Record<OpeningHoursDayKey, OpeningHoursDayConfig>;

const DEFAULT_OPENING_HOUR: OpeningHoursDayConfig = {
    enabled: false,
    mode: 'closed',
    open: '09:00',
    close: '18:00',
    morning_open: '09:00',
    morning_close: '13:00',
    afternoon_open: '16:00',
    afternoon_close: '20:00',
};

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

function isValidMode(value: unknown): value is OpeningHoursMode {
    return value === 'closed' || value === 'continuous' || value === 'split';
}

function inferMode(dayRecord: Record<string, unknown>): OpeningHoursMode {
    if (isValidMode(dayRecord.mode)) {
        return dayRecord.mode;
    }

    if (dayRecord.enabled !== true) {
        return 'closed';
    }

    const hasMorning = isValidTime(dayRecord.morning_open) && isValidTime(dayRecord.morning_close);
    const hasAfternoon =
        isValidTime(dayRecord.afternoon_open) && isValidTime(dayRecord.afternoon_close);

    if (hasMorning && hasAfternoon) {
        return 'split';
    }

    return 'continuous';
}

function isWithinRange(currentMinutes: number, open: string, close: string) {
    return toMinutes(open) <= currentMinutes && currentMinutes <= toMinutes(close);
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
        const mode = inferMode(dayRecord);

        normalized[day.key] = {
            enabled: mode !== 'closed',
            mode,
            open: isValidTime(dayRecord.open) ? dayRecord.open.trim() : DEFAULT_OPENING_HOUR.open,
            close: isValidTime(dayRecord.close)
                ? dayRecord.close.trim()
                : DEFAULT_OPENING_HOUR.close,
            morning_open: isValidTime(dayRecord.morning_open)
                ? dayRecord.morning_open.trim()
                : DEFAULT_OPENING_HOUR.morning_open,
            morning_close: isValidTime(dayRecord.morning_close)
                ? dayRecord.morning_close.trim()
                : DEFAULT_OPENING_HOUR.morning_close,
            afternoon_open: isValidTime(dayRecord.afternoon_open)
                ? dayRecord.afternoon_open.trim()
                : DEFAULT_OPENING_HOUR.afternoon_open,
            afternoon_close: isValidTime(dayRecord.afternoon_close)
                ? dayRecord.afternoon_close.trim()
                : DEFAULT_OPENING_HOUR.afternoon_close,
        };
    }

    return normalized;
}

export function formatOpeningHoursRange(day: OpeningHoursDayConfig) {
    if (!day.enabled || day.mode === 'closed') {
        return 'Cerrado';
    }

    if (day.mode === 'split') {
        return `${day.morning_open} - ${day.morning_close} / ${day.afternoon_open} - ${day.afternoon_close}`;
    }

    return `${day.open} - ${day.close}`;
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
          (currentDay.mode === 'split'
              ? isWithinRange(
                    currentMinutes,
                    currentDay.morning_open,
                    currentDay.morning_close,
                ) ||
                isWithinRange(
                    currentMinutes,
                    currentDay.afternoon_open,
                    currentDay.afternoon_close,
                )
              : currentDay.mode === 'continuous' &&
                isWithinRange(currentMinutes, currentDay.open, currentDay.close))
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
