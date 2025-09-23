const { Model, Op, fn, col, literal } = require('sequelize');
const schemas = require('../schema');

class Budget extends Model {
    static init(sequelize) {
        return super.init(schemas.budget, {
            sequelize,
            modelName: 'Budget',
            tableName: 'budgets',
            timestamps: false
        });
    }

    static async addExpense(userId, guildId, category, amount, description = null) {
        return await this.create({
            user_id: userId,
            guild_id: guildId,
            type: 'expense',
            category,
            amount,
            description
        });
    }

    static async addIncome(userId, guildId, amount, description = null) {
        return await this.create({
            user_id: userId,
            guild_id: guildId,
            type: 'income',
            category: 'Income',
            amount,
            description
        });
    }

    static async getSummary(userId, guildId, month = null) {
        const where = { user_id: userId, guild_id: guildId };

        if (month) {
            const year = new Date().getFullYear();
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            where.date = { [Op.between]: [startDate, endDate] };
        } else {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            where.date = { [Op.between]: [startOfMonth, endOfMonth] };
        }

        const entries = await this.findAll({ where });

        const income = entries
            .filter(e => e.type === 'income')
            .reduce((sum, e) => sum + e.amount, 0);

        const expenses = entries
            .filter(e => e.type === 'expense')
            .reduce((sum, e) => sum + e.amount, 0);

        const categories = {};
        entries
            .filter(e => e.type === 'expense')
            .forEach(e => {
                if (!categories[e.category]) {
                    categories[e.category] = 0;
                }
                categories[e.category] += e.amount;
            });

        return {
            income: income.toFixed(2),
            expenses: expenses.toFixed(2),
            balance: (income - expenses).toFixed(2),
            categories: Object.entries(categories).map(([name, amount]) => ({
                name,
                amount: amount.toFixed(2),
                percentage: ((amount / expenses) * 100).toFixed(1)
            })).sort((a, b) => b.amount - a.amount),
            entryCount: entries.length
        };
    }

    static async getCategories(userId, guildId) {
        const result = await this.findAll({
            where: { user_id: userId, guild_id: guildId, type: 'expense' },
            attributes: [
                'category',
                [fn('SUM', col('amount')), 'total'],
                [fn('COUNT', col('id')), 'count']
            ],
            group: ['category'],
            raw: true
        });

        return result.map(r => ({
            category: r.category,
            total: parseFloat(r.total).toFixed(2),
            count: r.count
        })).sort((a, b) => b.total - a.total);
    }

    static async getRecentEntries(userId, guildId, limit = 10) {
        return await this.findAll({
            where: { user_id: userId, guild_id: guildId },
            order: [['date', 'DESC']],
            limit
        });
    }

    static async getMonthlyTrend(userId, guildId, months = 6) {
        const results = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const entries = await this.findAll({
                where: {
                    user_id: userId,
                    guild_id: guildId,
                    date: { [Op.between]: [month, monthEnd] }
                }
            });

            const income = entries
                .filter(e => e.type === 'income')
                .reduce((sum, e) => sum + e.amount, 0);

            const expenses = entries
                .filter(e => e.type === 'expense')
                .reduce((sum, e) => sum + e.amount, 0);

            results.push({
                month: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
                income: income.toFixed(2),
                expenses: expenses.toFixed(2),
                balance: (income - expenses).toFixed(2)
            });
        }

        return results;
    }

    static async deleteEntry(entryId, userId, guildId) {
        const result = await this.destroy({
            where: { id: entryId, user_id: userId, guild_id: guildId }
        });

        return result > 0;
    }
}

module.exports = Budget;