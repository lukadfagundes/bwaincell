class Validators {
    static isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;

        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    static isValidTime(timeString) {
        const regex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
        return regex.test(timeString);
    }

    static isValidDateTime(dateTimeString) {
        const regex = /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/;
        if (!regex.test(dateTimeString)) return false;

        const dateTime = new Date(dateTimeString);
        return dateTime instanceof Date && !isNaN(dateTime);
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    }

    static isPositiveNumber(value) {
        return typeof value === 'number' && value > 0 && isFinite(value);
    }

    static isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static truncateString(str, maxLength = 1000) {
        if (typeof str !== 'string') return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }

    static parseCommaSeparated(input) {
        if (typeof input !== 'string') return [];
        return input.split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    static formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static formatDateTime(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getDayName(dayNumber) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayNumber] || 'Unknown';
    }

    static getRelativeTime(date) {
        const now = new Date();
        const target = new Date(date);
        const diff = target - now;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (diff < 0) {
            return 'Past';
        } else if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            return `${days} day${days !== 1 ? 's' : ''}`;
        }
    }

    static validatePermissions(interaction) {
        if (!interaction.guild) {
            return { valid: false, message: 'This command can only be used in a server.' };
        }

        if (!interaction.channel) {
            return { valid: false, message: 'Unable to access channel.' };
        }

        return { valid: true };
    }

    static paginate(items, page = 1, pageSize = 10) {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const totalPages = Math.ceil(items.length / pageSize);

        return {
            items: items.slice(startIndex, endIndex),
            currentPage: page,
            totalPages,
            totalItems: items.length,
            hasNext: page < totalPages,
            hasPrevious: page > 1
        };
    }
}

module.exports = Validators;