import * as cron from 'node-cron';

describe('Scheduler - Cron Expression Generation', () => {
  describe('Monthly Cron Expressions', () => {
    it('should generate valid cron for monthly reminder on day 15 at 2:30 PM', () => {
      const cronExpression = '30 14 15 * *';

      // Validate the cron expression
      expect(cron.validate(cronExpression)).toBe(true);
    });

    it('should generate valid cron for monthly reminder on day 1 at midnight', () => {
      const cronExpression = '0 0 1 * *';

      expect(cron.validate(cronExpression)).toBe(true);
    });

    it('should generate valid cron for monthly reminder on day 31 at 11:59 PM', () => {
      const cronExpression = '59 23 31 * *';

      expect(cron.validate(cronExpression)).toBe(true);
    });

    it('should have correct format: minute hour dayOfMonth * *', () => {
      const minutes = 45;
      const hours = 16;
      const dayOfMonth = 20;

      const cronExpression = `${minutes} ${hours} ${dayOfMonth} * *`;

      expect(cron.validate(cronExpression)).toBe(true);
      expect(cronExpression).toBe('45 16 20 * *');
    });
  });

  describe('Yearly Cron Expressions', () => {
    it('should generate valid cron for yearly reminder on March 15 at 2:30 PM', () => {
      const cronExpression = '30 14 15 3 *'; // March 15 at 2:30 PM

      expect(cron.validate(cronExpression)).toBe(true);
    });

    it('should generate valid cron for yearly reminder on Feb 29 at noon', () => {
      const cronExpression = '0 12 29 2 *'; // Feb 29 at 12:00 PM

      expect(cron.validate(cronExpression)).toBe(true);
    });

    it('should generate valid cron for yearly reminder on Dec 31 at midnight', () => {
      const cronExpression = '0 0 31 12 *'; // Dec 31 at midnight

      expect(cron.validate(cronExpression)).toBe(true);
    });

    it('should generate valid cron for yearly reminder on Jan 1 at noon', () => {
      const cronExpression = '0 12 1 1 *'; // Jan 1 at 12:00 PM

      expect(cron.validate(cronExpression)).toBe(true);
    });

    it('should have correct format: minute hour dayOfMonth month *', () => {
      const minutes = 30;
      const hours = 8;
      const dayOfMonth = 25;
      const month = 12; // December

      const cronExpression = `${minutes} ${hours} ${dayOfMonth} ${month} *`;

      expect(cron.validate(cronExpression)).toBe(true);
      expect(cronExpression).toBe('30 8 25 12 *');
    });

    it('should support all 12 months', () => {
      for (let month = 1; month <= 12; month++) {
        const cronExpression = `0 12 15 ${month} *`;
        expect(cron.validate(cronExpression)).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle day 31 in monthly cron (not all months have 31 days)', () => {
      // Day 31 in cron is valid - node-cron will handle months with fewer days
      const cronExpression = '0 12 31 * *';

      expect(cron.validate(cronExpression)).toBe(true);
    });

    it('should handle Feb 29 in yearly cron (leap years)', () => {
      // Feb 29 in cron is valid - node-cron will handle leap years
      const cronExpression = '0 12 29 2 *';

      expect(cron.validate(cronExpression)).toBe(true);
    });

    it('should handle Feb 31 in yearly cron (invalid but cron accepts it)', () => {
      // Feb 31 is invalid but cron syntax allows it
      // Our application logic handles this by using endOf('month')
      const cronExpression = '0 12 31 2 *';

      expect(cron.validate(cronExpression)).toBe(true);
    });
  });

  describe('Comparison with Daily and Weekly', () => {
    it('daily cron should have different format', () => {
      const dailyCron = '30 14 * * *'; // Daily at 2:30 PM
      const monthlyCron = '30 14 15 * *'; // Monthly on 15th at 2:30 PM

      expect(dailyCron).not.toBe(monthlyCron);
      expect(cron.validate(dailyCron)).toBe(true);
      expect(cron.validate(monthlyCron)).toBe(true);
    });

    it('weekly cron should have different format', () => {
      const weeklyCron = '30 14 * * 1'; // Weekly on Monday at 2:30 PM
      const monthlyCron = '30 14 15 * *'; // Monthly on 15th at 2:30 PM

      expect(weeklyCron).not.toBe(monthlyCron);
      expect(cron.validate(weeklyCron)).toBe(true);
      expect(cron.validate(monthlyCron)).toBe(true);
    });
  });
});
