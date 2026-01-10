import { EmbedBuilder } from 'discord.js';

export const EMBED_COLORS = {
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  WARNING: 0xffff00,
  INFO: 0x0099ff,
  TASK: 0x2ecc71,
  LIST: 0x3498db,
  REMINDER: 0xe74c3c,
  RANDOM: 0x9b59b6,
  SAVE: 0xf39c12,
} as const;

export function createSuccessEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function createErrorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.ERROR)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function createInfoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.INFO)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function createTaskEmbed(
  title: string,
  fields?: Array<{ name: string; value: string; inline?: boolean }>
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.TASK)
    .setTitle(`📋 ${title}`)
    .setTimestamp();

  if (fields && fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

export function createListEmbed(
  title: string,
  listName: string,
  items: Array<{ text: string; completed: boolean }>
): EmbedBuilder {
  const itemsText =
    items.length > 0
      ? items
          .map(
            (item, index) =>
              `${index + 1}. ${item.completed ? '~~' : ''}${item.text}${item.completed ? '~~' : ''}`
          )
          .join('\n')
      : '_No items in this list_';

  return new EmbedBuilder()
    .setColor(EMBED_COLORS.LIST)
    .setTitle(`📝 ${title}`)
    .setDescription(`**${listName}**\n\n${itemsText}`)
    .setFooter({ text: `${items.filter((i) => i.completed).length}/${items.length} completed` })
    .setTimestamp();
}

export function createReminderEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.REMINDER)
    .setTitle(`⏰ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function createRandomEmbed(
  title: string,
  description: string,
  footer?: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.RANDOM)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  if (footer) {
    embed.setFooter({ text: footer });
  }

  return embed;
}
