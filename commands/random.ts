import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction
} from 'discord.js';
import { logger } from '../shared/utils/logger';

// Import recipe data (will need to type this properly later)
const { dinnerOptions, movieData } = require('../utils/recipeData');

interface MovieDetails {
    year: string;
    genre: string;
    rating: string;
    link: string;
}

interface DinnerDetails {
    description: string;
    image: string;
    prepTime: string;
    difficulty: string;
    recipe: string;
}

const dateIdeas: string[] = [
    "Picnic in the park", "Movie night at home", "Visit a museum", "Go bowling",
    "Wine tasting", "Beach walk at sunset", "Cooking class together", "Escape room",
    "Mini golf", "Board game night", "Stargazing", "Visit a farmers market",
    "Go to a concert", "Take a dance class", "Visit an aquarium", "Go hiking"
];

const conversationStarters: string[] = [
    "What's the best advice you've ever received?",
    "If you could have dinner with anyone, dead or alive, who would it be?",
    "What's your favorite childhood memory?",
    "What skill would you love to learn and why?",
    "If you could live anywhere in the world, where would it be?",
    "What's the most interesting place you've ever visited?",
    "What's something you've always wanted to try but haven't yet?",
    "If you won the lottery tomorrow, what's the first thing you'd do?",
    "What's your biggest pet peeve?",
    "What's the best compliment you've ever received?",
    "If you could time travel, would you go to the past or future?",
    "What's your hidden talent?",
    "What's the most spontaneous thing you've ever done?",
    "If your life was a movie, what would it be called?",
    "What's your favorite way to spend a weekend?"
];

export default {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Random generators')
        .addSubcommand(subcommand =>
            subcommand
                .setName('movie')
                .setDescription('Pick a random movie'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dinner')
                .setDescription('Pick a random dinner option'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('date')
                .setDescription('Generate a random date idea'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('question')
                .setDescription('Get a conversation starter'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('choice')
                .setDescription('Pick from provided options')
                .addStringOption(option =>
                    option.setName('options')
                        .setDescription('Comma-separated options (e.g., "option1,option2,option3")')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('number')
                .setDescription('Generate a random number')
                .addIntegerOption(option =>
                    option.setName('min')
                        .setDescription('Minimum value (default: 1)')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('max')
                        .setDescription('Maximum value (default: 100)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('coin')
                .setDescription('Flip a coin'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dice')
                .setDescription('Roll dice')
                .addIntegerOption(option =>
                    option.setName('sides')
                        .setDescription('Number of sides (default: 6)')
                        .setRequired(false)
                        .setMinValue(2)
                        .setMaxValue(100))
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of dice (default: 1)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(10))),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        // CRITICAL: Immediate acknowledgment - must be first
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();

        try {
            const embed = new EmbedBuilder()
                .setColor(0x9932CC)
                .setTimestamp();

            switch (subcommand) {
                case 'movie': {
                    const movieTitles = Object.keys(movieData);
                    const movie = movieTitles[Math.floor(Math.random() * movieTitles.length)];
                    const details: MovieDetails = movieData[movie];

                    embed.setTitle('🎬 Random Movie Pick')
                        .setDescription(`**${movie}**`)
                        .addFields(
                            { name: 'Year', value: details.year, inline: true },
                            { name: 'Genre', value: details.genre, inline: true },
                            { name: 'IMDb Rating', value: `⭐ ${details.rating}/10`, inline: true }
                        )
                        .setFooter({ text: 'Click the button below for more info' });

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('View on IMDb')
                                .setURL(details.link)
                                .setStyle(ButtonStyle.Link)
                                .setEmoji('🎥'),
                            new ButtonBuilder()
                                .setCustomId('random_movie_reroll')
                                .setLabel('Pick Another')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🎲')
                        );

                    await interaction.editReply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'dinner': {
                    const dinnerNames = Object.keys(dinnerOptions);
                    const dinner = dinnerNames[Math.floor(Math.random() * dinnerNames.length)];
                    const details: DinnerDetails = dinnerOptions[dinner];

                    embed.setTitle('🍽️ Random Dinner Pick')
                        .setDescription(`**${dinner}**\n${details.description}`)
                        .setImage(details.image)
                        .addFields(
                            { name: '⏱️ Prep Time', value: details.prepTime, inline: true },
                            { name: '📊 Difficulty', value: details.difficulty, inline: true }
                        )
                        .setFooter({ text: 'Click below for the full recipe!' });

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('View Recipe')
                                .setURL(details.recipe)
                                .setStyle(ButtonStyle.Link)
                                .setEmoji('📖'),
                            new ButtonBuilder()
                                .setCustomId('random_dinner_reroll')
                                .setLabel('Pick Another')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🎲'),
                            new ButtonBuilder()
                                .setCustomId(`save_dinner_${dinner}`)
                                .setLabel('Save to List')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('💾')
                        );

                    await interaction.editReply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'date': {
                    const date = dateIdeas[Math.floor(Math.random() * dateIdeas.length)];
                    embed.setTitle('💑 Random Date Idea')
                        .setDescription(`**${date}**`)
                        .addFields(
                            { name: '💡 Tip', value: 'Make it special by adding your personal touch!' }
                        );

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('random_date_reroll')
                                .setLabel('Get Another Idea')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('💝')
                        );

                    await interaction.editReply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'question': {
                    const question = conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
                    embed.setTitle('💭 Conversation Starter')
                        .setDescription(question);

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('random_question_reroll')
                                .setLabel('Next Question')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('💬')
                        );

                    await interaction.editReply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'choice': {
                    const optionsString = interaction.options.getString('options', true);
                    const options = optionsString.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);

                    if (options.length < 2) {
                        await interaction.editReply({
                            content: 'Please provide at least 2 options separated by commas.',
                            
                        });
                        return;
                    }

                    const choice = options[Math.floor(Math.random() * options.length)];
                    embed.setTitle('🎲 Random Choice')
                        .setDescription(`From: ${options.join(', ')}\n\nI choose: **${choice}**`);

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'number': {
                    const min = interaction.options.getInteger('min') || 1;
                    const max = interaction.options.getInteger('max') || 100;

                    if (min >= max) {
                        await interaction.editReply({
                            content: 'Minimum must be less than maximum.',
                            
                        });
                        return;
                    }

                    const number = Math.floor(Math.random() * (max - min + 1)) + min;
                    embed.setTitle('🔢 Random Number')
                        .setDescription(`Range: ${min} - ${max}\n\nResult: **${number}**`);

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'coin': {
                    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
                    const emoji = result === 'Heads' ? '👑' : '⚡';
                    embed.setTitle('🪙 Coin Flip')
                        .setDescription(`${emoji} **${result}**`);

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'dice': {
                    const sides = interaction.options.getInteger('sides') || 6;
                    const count = interaction.options.getInteger('count') || 1;
                    const rolls: number[] = [];
                    let total = 0;

                    for (let i = 0; i < count; i++) {
                        const roll = Math.floor(Math.random() * sides) + 1;
                        rolls.push(roll);
                        total += roll;
                    }

                    embed.setTitle('🎲 Dice Roll')
                        .setDescription(`Rolling ${count}d${sides}`);

                    if (count === 1) {
                        embed.addFields({ name: 'Result', value: `**${rolls[0]}**` });
                    } else {
                        embed.addFields(
                            { name: 'Rolls', value: rolls.join(', ') },
                            { name: 'Total', value: `**${total}**` }
                        );
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;

            logger.error('Error in random command', {
                subcommand,
                error: errorMessage,
                stack: errorStack
            });

            await interaction.editReply({
                content: 'An error occurred while processing your request.',
                
            });
        }
    }
};