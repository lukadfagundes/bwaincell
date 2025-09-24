import { TextChannel, NewsChannel, ThreadChannel } from 'discord.js';

export function validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
        valid: emailRegex.test(email),
        error: emailRegex.test(email) ? undefined : 'Invalid email format'
    };
}

export function validateDate(date: string | Date): { valid: boolean; error?: string } {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return {
        valid: !isNaN(dateObj.getTime()),
        error: isNaN(dateObj.getTime()) ? 'Invalid date' : undefined
    };
}

export function paginate<T>(
    items: T[],
    page: number = 1,
    perPage: number = 10
): {
    data: T[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
} {
    const offset = (page - 1) * perPage;
    const paginatedItems = items.slice(offset, offset + perPage);

    return {
        data: paginatedItems,
        currentPage: page,
        totalPages: Math.ceil(items.length / perPage),
        totalItems: items.length
    };
}

export function isValidChannel(channel: any): channel is TextChannel | NewsChannel | ThreadChannel {
    return channel && (channel.type === 0 || channel.type === 5 || channel.type === 11);
}
