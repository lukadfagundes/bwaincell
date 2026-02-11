/**
 * Migration: Create event_configs table
 * Description: Add support for AI-powered local events discovery with automated announcements
 * Date: 2026-02-10
 */

module.exports = {
  /**
   * Create event_configs table
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('event_configs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      guild_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // One configuration per guild
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Admin who configured the events feature',
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Location for event search (e.g., "Los Angeles, CA")',
      },
      announcement_channel_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Discord channel ID for posting events',
      },
      schedule_day: {
        type: Sequelize.INTEGER,
        defaultValue: 1, // Monday
        allowNull: false,
        comment: 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)',
      },
      schedule_hour: {
        type: Sequelize.INTEGER,
        defaultValue: 12, // Noon
        allowNull: false,
        comment: 'Hour of day (0-23) in 24-hour format',
      },
      schedule_minute: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Minute of hour (0-59)',
      },
      timezone: {
        type: Sequelize.STRING,
        defaultValue: 'America/Los_Angeles',
        allowNull: false,
        comment: 'Timezone for scheduling (IANA timezone)',
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether automated announcements are enabled',
      },
      last_announcement: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of last event announcement',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });

    // Add index on guild_id for faster lookups
    await queryInterface.addIndex('event_configs', ['guild_id'], {
      name: 'event_configs_guild_id_idx',
      unique: true,
    });

    // Add index on is_enabled for finding active configurations
    await queryInterface.addIndex('event_configs', ['is_enabled'], {
      name: 'event_configs_is_enabled_idx',
    });

    console.log('✅ Migration: event_configs table created successfully');
  },

  /**
   * Drop event_configs table
   */
  down: async (queryInterface, Sequelize) => {
    // Drop indexes first
    await queryInterface.removeIndex('event_configs', 'event_configs_is_enabled_idx');
    await queryInterface.removeIndex('event_configs', 'event_configs_guild_id_idx');

    // Drop table
    await queryInterface.dropTable('event_configs');

    console.log('✅ Rollback: event_configs table dropped successfully');
  },
};
