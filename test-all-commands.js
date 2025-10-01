// Test script to verify all Discord bot commands
const fs = require('fs');
const path = require('path');

console.log('=== BWAINCELL COMMAND AUDIT ===\n');

// Load TypeScript support
require('ts-node/register');

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts') && !file.includes('.backup'));

const commands = [];
let totalSubcommands = 0;
let totalOptions = 0;

console.log(`Found ${commandFiles.length} command files\n`);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  const commandModule = command.default || command;

  if (commandModule.data && commandModule.execute) {
    const data = commandModule.data.toJSON();
    commands.push(data);

    console.log(`📁 /${data.name} - ${data.description}`);

    // Check for subcommands
    if (data.options && data.options.length > 0) {
      const subcommands = data.options.filter(opt => opt.type === 1); // SUB_COMMAND type
      const subcommandGroups = data.options.filter(opt => opt.type === 2); // SUB_COMMAND_GROUP type
      const directOptions = data.options.filter(opt => opt.type !== 1 && opt.type !== 2);

      if (subcommands.length > 0) {
        console.log(`   Subcommands (${subcommands.length}):`);
        subcommands.forEach(sub => {
          console.log(`     • /${data.name} ${sub.name} - ${sub.description}`);
          if (sub.options && sub.options.length > 0) {
            const required = sub.options.filter(o => o.required);
            const optional = sub.options.filter(o => !o.required);
            console.log(
              `       └─ ${required.length} required, ${optional.length} optional parameters`
            );
            totalOptions += sub.options.length;
          }
        });
        totalSubcommands += subcommands.length;
      }

      if (subcommandGroups.length > 0) {
        console.log(`   Subcommand Groups (${subcommandGroups.length}):`);
        subcommandGroups.forEach(group => {
          console.log(`     • /${data.name} ${group.name} - ${group.description}`);
          if (group.options && group.options.length > 0) {
            group.options.forEach(sub => {
              console.log(`       • ${sub.name} - ${sub.description}`);
            });
            totalSubcommands += group.options.length;
          }
        });
      }

      if (directOptions.length > 0) {
        console.log(`   Direct Options (${directOptions.length}):`);
        directOptions.forEach(opt => {
          const typeNames = {
            3: 'STRING',
            4: 'INTEGER',
            5: 'BOOLEAN',
            6: 'USER',
            7: 'CHANNEL',
            8: 'ROLE',
            9: 'MENTIONABLE',
            10: 'NUMBER',
            11: 'ATTACHMENT',
          };
          console.log(
            `     • ${opt.name} (${typeNames[opt.type] || opt.type})${opt.required ? ' [REQUIRED]' : ''} - ${opt.description}`
          );
        });
        totalOptions += directOptions.length;
      }
    } else {
      console.log(`   No subcommands or options`);
    }

    // Check for autocomplete
    const hasAutocomplete = commandModule.autocomplete ? '✅' : '❌';
    console.log(`   Autocomplete support: ${hasAutocomplete}`);

    // Check execute function
    const hasExecute = typeof commandModule.execute === 'function' ? '✅' : '❌';
    console.log(`   Execute function: ${hasExecute}`);

    console.log('');
  } else {
    console.log(`❌ FAILED TO LOAD: ${file}`);
    console.log(
      `   Missing: ${!commandModule.data ? 'data' : ''} ${!commandModule.execute ? 'execute' : ''}`
    );
    console.log('');
  }
}

console.log('=== SUMMARY ===');
console.log(`Total Commands: ${commands.length}`);
console.log(`Total Subcommands: ${totalSubcommands}`);
console.log(`Total Options: ${totalOptions}`);

// Check for common issues
console.log('\n=== POTENTIAL ISSUES ===');

commands.forEach(cmd => {
  // Check for commands without subcommands
  if (!cmd.options || cmd.options.length === 0) {
    console.log(`⚠️  /${cmd.name} has no subcommands or options`);
  }

  // Check for duplicate command names
  const duplicates = commands.filter(c => c.name === cmd.name);
  if (duplicates.length > 1) {
    console.log(`⚠️  Duplicate command name: /${cmd.name}`);
  }
});

console.log('\n=== COMMAND COMPLEXITY ===');
commands.forEach(cmd => {
  const subcommandCount = cmd.options ? cmd.options.filter(o => o.type === 1).length : 0;
  const complexity =
    subcommandCount === 0
      ? 'Simple'
      : subcommandCount <= 3
        ? 'Moderate'
        : subcommandCount <= 6
          ? 'Complex'
          : 'Very Complex';
  console.log(`/${cmd.name}: ${complexity} (${subcommandCount} subcommands)`);
});

console.log('\n✅ Command audit complete!');
