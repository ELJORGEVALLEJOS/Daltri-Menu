const DEFAULT_LOCALE = 'es-MX';

function toFiniteNumber(value: number) {
    return Number.isFinite(value) ? value : 0;
}

export function formatNumber(
    value: number,
    options?: Intl.NumberFormatOptions,
    locale = DEFAULT_LOCALE,
) {
    return new Intl.NumberFormat(locale, options).format(toFiniteNumber(value));
}

export function formatMoney(
    value: number,
    options?: Intl.NumberFormatOptions,
    locale = DEFAULT_LOCALE,
) {
    return `$${formatNumber(value, options, locale)}`;
}
