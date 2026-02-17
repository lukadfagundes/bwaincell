import * as fs from 'fs';
import * as path from 'path';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { logger } from '../shared/utils/logger';
import config from '../config/config';

/** Path to the version tracking file (persisted via Docker volume mount) */
const VERSION_FILE = path.resolve(__dirname, '../../data/.last-announced-version');

/** Path to root package.json (contains monorepo version) */
const PACKAGE_JSON = path.resolve(__dirname, '../../package.json');

/** Path to CHANGELOG.md at repository root */
const CHANGELOG_PATH = path.resolve(__dirname, '../../CHANGELOG.md');

/** Discord embed description limit */
const EMBED_MAX_LENGTH = 4096;

function getAppVersion(): string {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  return pkg.version;
}

function getLastAnnouncedVersion(): string | null {
  try {
    return fs.readFileSync(VERSION_FILE, 'utf-8').trim();
  } catch {
    return null;
  }
}

function setLastAnnouncedVersion(version: string): void {
  try {
    const dir = path.dirname(VERSION_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(VERSION_FILE, version, 'utf-8');
  } catch (error) {
    logger.warn('Failed to write version file (non-fatal)', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Extract release notes for a specific version from CHANGELOG.md.
 * Looks for the section between `## [version]` and the next `## [` header.
 */
function extractChangelogNotes(version: string): string | null {
  try {
    const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
    const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sectionRegex = new RegExp(`## \\[${escapedVersion}\\][^\\n]*\\n([\\s\\S]*?)(?=## \\[|$)`);
    const match = changelog.match(sectionRegex);
    if (!match || !match[1].trim()) {
      return null;
    }
    return match[1].trim();
  } catch {
    return null;
  }
}

/**
 * Announce a new release to the configured Discord channel.
 * Compares the running version against the last announced version.
 * Non-fatal: logs warnings on failure but never throws.
 */
export async function announceRelease(client: Client): Promise<void> {
  try {
    const channelId = config.settings.defaultReminderChannel;
    if (!channelId) {
      return;
    }

    const version = getAppVersion();
    const lastAnnounced = getLastAnnouncedVersion();

    if (version === lastAnnounced) {
      return;
    }

    const notes = extractChangelogNotes(version);

    const embed = new EmbedBuilder()
      .setTitle(`Bwaincell v${version} Released`)
      .setColor(0x00b894)
      .setTimestamp();

    if (notes) {
      const description =
        notes.length > EMBED_MAX_LENGTH ? notes.slice(0, EMBED_MAX_LENGTH - 3) + '...' : notes;
      embed.setDescription(description);
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !('send' in channel)) {
      logger.warn('Release announcement channel not found or not a text channel', {
        channelId,
      });
      return;
    }

    await (channel as TextChannel).send({ embeds: [embed] });

    setLastAnnouncedVersion(version);

    logger.info('Release announcement sent', { version, channelId });
  } catch (error) {
    logger.warn('Failed to send release announcement (non-fatal)', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
