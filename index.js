require('dotenv').config();
const http = require('http');
const ftp = require('basic-ftp');
const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// 1. ZUERST den Discord-Client erstellen, damit er überall im Code bekannt ist
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 2. DANACH den Dummyserver für Render starten
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is alive!');
}).listen(process.env.PORT || 10000, '0.0.0.0', () => {
  console.log('📡 Webserver erfolgreich gestartet auf Port 10000');
});

// ==================================================
// ⚙️ KONFIGURATION
// ==================================================
const BILD_REGELN_URL = 'https://cdn.discordapp.com/attachments/1345156608069468181/1487139327258525866/18083.png?ex=6a0e962d&is=6a0d44ad&hm=04eb0fb130971d863d3204b3b9833ea6b37edc43feb9bde86c1f4fc1327f7e96&';
const BILD_INFO_URL = 'https://cdn.discordapp.com/attachments/1345156608069468181/1487145646841532476/18089.png?ex=6a0e9c10&is=6a0d4a90&hm=78ce47db3e677a97031197c59248aad0fc137f5736925c7650bca4c9079276f8&';
const BILD_KONZEPT_URL = 'https://cdn.discordapp.com/attachments/1345156608069468181/1487146426743001200/18091.png?ex=6a0e9cc9&is=6a0d4b49&hm=ba102995b4f3a91ffefc36e33a65f14e93c03a10d1427149e2a01463e8fc48ae&';
const BILD_WELCOME_URL = 'https://cdn.discordapp.com/attachments/1345156608069468181/1487865346701529239/18393.png?ex=6a0e9755&is=6a0d45d5&hm=68c75385d6cbfd452f19097b54d38a7c592af3c7694c89c79daf9194a539129f&';

const AUTO_JOIN_ROLE_ID = '810988239300329531';
const ROLLEN_ID = '1374642671473262704';
const ROLE_SUPPORT = '837077005093961770';
const ROLE_ADMIN = '804253996109267016';
const ROLE_UN = '1210529318996803624';
const ROLE_ARZT = '1384468931770585088';
const CATEGORY_TICKET_ID = '1166648934173790208';
const CATEGORY_WL_ID = '804415236857004074';

// ==================================================
// ⚙️ SYSTEM-KONFIGURATION (BILDER, ROLLEN & KATEGORIEN)
// ==================================================
const CATEGORY_NOTFUNK_ID = '1196411229506392106';  // Notfunk-Kategorie

// Ändere diese Zeile:
let nitradoServerId = '18964751'; // Wird beim Start automatisch abgerufen

// Axios-Instanz für Nitrado API vorbereiten
const nitradoAPI = axios.create({
    baseURL: 'https://api.nitrado.net/',
    headers: { 'Authorization': `Bearer ${process.env.NITRADO_TOKEN}` }
});

// Bot-Startmeldung & automatischer Server-ID Check
client.once('ready', async (readyClient) => {
    console.log(`✅ ${readyClient.user.tag} für Project Necro ist online!`);
    
    if (process.env.NITRADO_TOKEN) {
        console.log('🔗 Nitrado-Schnittstelle wurde im Hintergrund initialisiert.');
        try {
            // Automatisch die erste aktive Gameserver-ID von Nitrado abrufen
            const response = await nitradoAPI.get('services');
            const services = response.data.data.services;
            const gameserver = services.find(s => s.type === 'gameserver');
            
            if (gameserver) {
                nitradoServerId = gameserver.details.id;
                console.log(`📡 Nitrado Server-ID automatisch geladen: ${nitradoServerId} (${gameserver.details.name})`);
            } else {
                console.log('⚠️ Hinweis: Kein aktiver Gameserver auf diesem Nitrado-Account gefunden.');
            }
        } catch (error) {
            console.error('❌ Fehler beim automatischen Abruf der Nitrado-Server-ID:', error.message);
        }
    } else {
        console.log('⚠️ Hinweis: Kein NITRADO_TOKEN in der .env gefunden.');
    }
});

// ==================================================
// 👋 WELCOMER & AUTOMATISCHE ROLLE BEI SERVERBEITRITT
// ==================================================
client.on('guildMemberAdd', async (member) => {
    try {
        await member.roles.add(AUTO_JOIN_ROLE_ID);
        console.log(`ℹ️ Rolle automatisch zugewiesen an: ${member.user.tag}`);
    } catch (e) {
        console.error('❌ Fehler beim Zuweisen der Auto-Join-Rolle:', e.message);
    }

    const welcomeChannel = member.guild.channels.cache.get('1344957194457579530') || member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.permissionsFor(member.guild.members.me).has(PermissionFlagsBits.SendMessages));
    if (!welcomeChannel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('☣️ NEUER SURVIVOR EINGETROFFEN')
        .setDescription(`**Herzlich Willkommen,**\n` +
            `Servus ${member} 👋 und Herzlich Willkommen auf dem **Project NECRO - RP Server.**\n\n` +
            `Schön, dass du zu uns gefunden hast!\n` +
            `*Bevor dein Überleben beginnt, schau dich in Ruhe um und folge dem Protokoll, um vollen Zugang zum Discord und dem Server zu erhalten:*\n\n` +
            `┃ＤＡＳ ＰＲＯＴＯＫＯＬＬ┃\n\n` +
            `📜 **REGELN BESTÄTIGEN:**\n` +
            `Lies dir unser Regelwerk aufmerksam durch und bestätige es im Kanal, um die ersten Kanäle freizuschalten.\n\n` +
            `🧠 **KONZEPT VERSTEHEN:**\n` +
            `Wirf einen Blick in das <#1504902166714908722>.\n\n` +
            `🎟️ **WHITELIST ANFRAGE:**\n` +
            `Reiche deine Daten im Kanal <#1295683276434047009> ein.\n\n` +
            `Unser Team wird sich umgehend bei dir melden.\n\n` +
            `Für Fragen, Wünsche, Beschwerden oder sonstige Anregungen benutze bitte unser Ticket-System im Bereich <#1166342409093922936>.\n\n` +
            `Ein freier Admin oder Supporter wird Kontakt zu dir aufnehmen.\n\n` +
            `Danke 👋\n` +
            `Wir freuen uns auf ein intensives RP mit Dir!`)
        .setImage(BILD_WELCOME_URL)
        .setTimestamp();

    await welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(console.error);
});

// ==================================================
// 🖱️ INTERACTION LOGIK (BUTTONS FÜR ALLE SYSTEME)
// ==================================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    // --- WHITELIST MODAL SUBMIT ---
    if (interaction.isModalSubmit() && interaction.customId === 'whitelist_modal') {
        const psnId = interaction.fields.getTextInputValue('psn_id_input');
        
        await interaction.reply({ content: '✅ Daten übermittelt.', ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('📥 Neue Whitelist-Anfrage')
            .setDescription(`User: ${interaction.user}\nPSN-ID: ${psnId}`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('wl_accept').setLabel('Akzeptieren').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('wl_deny').setLabel('Ablehnen').setStyle(ButtonStyle.Danger)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        return;
    }

    // A) REGELN AKZEPTIEREN
    if (interaction.customId === 'accept_rules') {
        try {
            const member = interaction.member;
            if (member.roles.cache.has(ROLLEN_ID)) {
                return await interaction.reply({ content: '❌ Du hast die Regeln bereits akzeptiert!', ephemeral: true });
            }
            await member.roles.add(ROLLEN_ID);
            await interaction.reply({ content: '✅ Du hast die Regeln erfolgreich akzeptiert und deine Rolle erhalten!', ephemeral: true });
            await member.send('✉️ Du hast die Regeln bestätigt. Viel Erfolg beim Überleben!').catch(() => {});
        } catch (e) { console.error(e); }
        return;
    }

    // B) ALLGEMEINES TICKET-SYSTEM
    if (['ticket_support', 'ticket_report', 'ticket_admin'].includes(interaction.customId)) {
        await interaction.deferReply({ ephemeral: true });

        let categoryName = '';
        let allowedRoles = [ROLE_ADMIN];

        if (interaction.customId === 'ticket_support') {
            categoryName = 'support';
            allowedRoles.push(ROLE_SUPPORT);
        } else if (interaction.customId === 'ticket_report') {
            categoryName = 'melden';
            allowedRoles.push(ROLE_SUPPORT);
        } else if (interaction.customId === 'ticket_admin') {
            categoryName = 'admin';
        }

        const username = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const channelName = `${categoryName}-${username}`;

        const permissionOverwrites = [
            { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }
        ];

        allowedRoles.forEach(roleId => {
            permissionOverwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] });
        });

        try {
            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: CATEGORY_TICKET_ID,
                permissionOverwrites: permissionOverwrites
            });

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle(`🎫 OFFENES TICKET: ${categoryName.toUpperCase()}`)
                .setDescription(`Hallo ${interaction.user}, willkommen in deinem persönlichen Ticket.\n\nBitte schildere dein Anliegen so genau wie möglich.\n` + (categoryName === 'melden' ? `⚠️ **Wichtig:** Lade deinen ungeschnittenen Video-Beweis (Clip-Pflicht) bitte direkt hier als Datei oder Link hoch!\n` : '') + `\nDas zuständige Team wurde benachrichtigt und ist gleich für dich da.`);

            await ticketChannel.send({ embeds: [welcomeEmbed] });
            await interaction.editReply({ content: `✅ Dein Ticket wurde erstellt: ${ticketChannel}`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Ticket konnte nicht erstellt werden.', ephemeral: true });
        }
        return;
    }

    if (interaction.customId === 'ticket_whitelist') {
        await interaction.deferReply({ ephemeral: true });
        
        const ch = await interaction.guild.channels.create({
            name: `wl-${interaction.user.username.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: '804415236857004074',
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ROLE_SUPPORT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ROLE_ADMIN, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📝 WHITELIST-INFORMATIONEN')
            .setDescription('Bevor wir Deine Anfrage akzeptieren, brauchen wir noch ein paar Informationen:\n\n1. Wie heißt du?\n2. Wie alt bist du?\n3. Schick uns eine kurze Charakterbeschreibung (so sehen wir, ob du wirklich in der Lage bist, eine Rolle zu verkörpern).\n\nWenn du das alles beantwortet hast, indem du direkt in das Ticket schreibst, drücke unten auf den Button "PSN-ID einreichen".');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('submit_psn').setLabel('PSN-ID einreichen').setStyle(ButtonStyle.Success)
        );

        await ch.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: `✅ Dein Whitelist-Ticket wurde erstellt: ${ch}`, ephemeral: true });
        return;
    }

    if (interaction.customId === 'submit_psn') {
        const modal = new ModalBuilder()
            .setCustomId('whitelist_modal')
            .setTitle('Whitelist-Anfrage');

        const psnInput = new TextInputBuilder()
            .setCustomId('psn_id_input')
            .setLabel('Wie lautet deine PSN-ID?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(psnInput));
        await interaction.showModal(modal);
        return;
    }

    // --- VERARBEITUNG DES MODALS (Buttons direkt im Ticket) ---
    if (interaction.isModalSubmit() && interaction.customId === 'whitelist_modal') {
        const psnId = interaction.fields.getTextInputValue('psn_id_input');
        
        await interaction.reply({ content: '✅ Deine Daten wurden übermittelt. Das Team entscheidet in Kürze.', ephemeral: true });

        const logEmbed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('📥 Neue Whitelist-Anfrage')
            .setDescription(`User: ${interaction.user}\nPSN-ID: ${psnId}\n\nEntscheidung steht aus:`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('wl_accept').setLabel('Akzeptieren').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('wl_deny').setLabel('Ablehnen').setStyle(ButtonStyle.Danger)
        );

        await interaction.channel.send({ embeds: [logEmbed], components: [row] });
        return;
    }

    if (interaction.customId === 'wl_accept') {
        // 1. Rollen-Check für den Admin (nur berechtigte dürfen akzeptieren)
        if (!interaction.member.roles.cache.has('1506903144624554024')) {
            return interaction.reply({ content: '❌ Nur Admins dürfen akzeptieren!', ephemeral: true });
        }

        // 2. Daten aus dem Embed holen
        const embed = interaction.message.embeds[0];
        const psnIdMatch = embed.description.match(/PSN-ID: (.*)/);
        const psnId = psnIdMatch ? psnIdMatch[1].trim() : 'Unbekannt';
        const userIdMatch = embed.description.match(/\d{17,19}/);
        const userId = userIdMatch ? userIdMatch[0] : null;
        const member = userId ? await interaction.guild.members.fetch(userId).catch(() => null) : null;

        if (member) {
            // 3. Rollen zuweisen (Beide Rollen gleichzeitig)
            await member.roles.add(['1374642671473262704', '808650438533447700']).catch(err => console.error('Rollenfehler:', err));

            // API-Versuch überspringen, direkt FTP nutzen:
            const ftpSuccess = await addToWhitelistFTP(psnId);

            if (ftpSuccess) {
                await interaction.update({ content: `✅ ${psnId} wurde in die whitelist.txt geschrieben!`, components: [] });
            } else {
                await interaction.update({ content: `⚠️ Fehler beim FTP-Upload.`, components: [] });
            }
        } else {
            await interaction.reply({ content: '❌ User konnte auf dem Server nicht gefunden werden.', ephemeral: true });
        }
        return;
    }

    if (interaction.customId === 'wl_deny') {
        if (!interaction.member.roles.cache.has('1506903144624554024')) {
            return interaction.reply({ content: '❌ Du hast keine Berechtigung!', ephemeral: true });
        }
        await interaction.reply('❌ Abgelehnt.');
        return;
    }

    // C) NOTFUNK-SYSTEM
    if (['notfunk_med', 'notfunk_help'].includes(interaction.customId)) {
        await interaction.deferReply({ ephemeral: true });

        let prefix = '';
        let allowedRoles = [ROLE_SUPPORT];

        if (interaction.customId === 'notfunk_med') {
            prefix = 'medizin';
            allowedRoles.push(ROLE_ARZT);
        } else if (interaction.customId === 'notfunk_help') {
            prefix = 'notruf';
            allowedRoles.push(ROLE_UN);
        }

        const username = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const channelName = `${prefix}-${username}`;

        const permissionOverwrites = [
            { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }
        ];

        allowedRoles.forEach(roleId => {
            permissionOverwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] });
        });

        try {
            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: CATEGORY_NOTFUNK_ID,
                permissionOverwrites: permissionOverwrites
            });

            let alertMessage = '';
            if (interaction.customId === 'notfunk_med') {
                alertMessage = `🚨 **EINGEHENDER MEDIZINISCHER NOTRUF!**\n\nEinheiten anfordern für ${interaction.user}.\nSchildern Sie Ihren Standort und die Schwere der Verletzungen. Die medizinische Abteilung wurde alarmiert.`;
            } else {
                alertMessage = `🪖 **EINGEHENDE ANFORDERUNG VON UNTERSTÜTZUNG!**\n\nSicherheitskräfte anfordern für ${interaction.user}.\nGeben Sie Koordinaten, Feindstärke und Bedrohungslage durch. Die UN-Einheiten und das Support-Team wurden benachrichtigt.`;
            }

            const alertEmbed = new EmbedBuilder()
                .setColor(interaction.customId === 'notfunk_med' ? '#e74c3c' : '#3498db')
                .setTitle(`📡 OFFENE FREQUENZ: ${prefix.toUpperCase()}`)
                .setDescription(alertMessage)
                .setTimestamp();

            await ticketChannel.send({ embeds: [alertEmbed] });
            await interaction.editReply({ content: `📟 Frequenz geöffnet. Ihr Notfunk-Kanal wurde erstellt: ${ticketChannel}`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Verbindung zur Leitstelle fehlgeschlagen.', ephemeral: true });
        }
    }
});

// ==================================================
// 💬 CHAT-BEFEHLE (ALLE SEPARAT NUTZBAR)
// ==================================================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // 1. Test-Befehl
    if (message.content === '!test') {
        await message.reply('🌵 Oasis of the Damned ist einsatzbereit!').catch(console.error);
    }

    // ⭐ NITRADO-WHITELIST BEFEHL (!wl PSNName)
    if (message.content.startsWith('!wl ')) {
        // Berechtigungsprüfung (Nur Admins oder Supporter dürfen whitelisten)
        if (!message.member.roles.cache.has(ROLE_ADMIN) && !message.member.roles.cache.has(ROLE_SUPPORT)) {
            return message.reply('❌ Du hast keine Berechtigung, diesen Befehl auszuführen.').catch(console.error);
        }

        if (!nitradoServerId) {
            return message.reply('❌ Nitrado Server-ID ist nicht geladen. Bitte überprüfe das Bot-Terminal.').catch(console.error);
        }

        const psnName = message.content.slice(4).trim();
        if (!psnName) return message.reply('❌ Bitte gib einen Namen an! Beispiel: `!wl MaxMustermann`').catch(console.error);

        try {
            // API-Aufruf an Nitrado, um den PSN-Namen zur DayZ-Whitelist hinzuzufügen
            await nitradoAPI.post(`gameservers/${nitradoServerId}/games/whitelist`, {
                playlist: psnName
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('🟢 WHITELIST-EINTRAG ERFOLGREICH')
                .setDescription(`Der Überlebende **${psnName}** wurde erfolgreich in das Nitrado-Protokoll aufgenommen und darf den Server ab sofort betreten.\n\n*Eingetragen durch: ${message.author}*`)
                .setTimestamp();

            await message.channel.send({ embeds: [successEmbed] }).catch(console.error);
        } catch (error) {
            console.error('API Fehler bei Whitelist:', error.response ? error.response.data : error.message);
            await message.reply(`❌ Fehler beim Eintragen in die Nitrado-API. Eventuell ist der Name bereits auf der Liste oder das API-Limit wurde erreicht.`).catch(console.error);
        }
        return;
    }

    if (message.content === '!postwhitelist') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🎫 WHITELIST-ANFRAGE')
            .setDescription('Hi, wenn du soweit mit dem Konzept zufrieden bist und die Regeln akzeptiert sind, kannst du, indem du den Button drückst, dein Whitelist-Ticket öffnen.');

        const btn = new ButtonBuilder()
            .setCustomId('ticket_whitelist')
            .setLabel('Ich will auf die Whitelist')
            .setStyle(ButtonStyle.Success);

        await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(btn)] });
        await message.delete();
        return;
    }

    // 2. Titelelemente (Bilder) separat posten
    if (message.content === '!postbild') {
        await message.channel.send({ files: [BILD_REGELN_URL] }).catch(console.error);
        await message.delete().catch(console.error);
    }
    if (message.content === '!infotitel') {
        await message.channel.send({ files: [BILD_INFO_URL] }).catch(console.error);
        await message.delete().catch(console.error);
    }
    if (message.content === '!konzepttitel') {
        await message.channel.send({ files: [BILD_KONZEPT_URL] }).catch(console.error);
        await message.delete().catch(console.error);
    }

    // 3. !postinfo
    if (message.content === '!postinfo') {
        const infoEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🛠️ TECHNIK & SUPPORT')
            .setDescription(`**📅 Support-Zeiten**\n` +
                `Mo – Fr: 12:00 – 14:00 & 18:00 – 21:45 Uhr\n` +
                `Wochenende: Spontan (Privatleben geht vor).\n\n` +
                `**Ticket-Kanal:** <#1166342409093922936>\n\n` +
                `**📊 Überwachung & Logs**\n` +
                `Ein Admin-Bot überwacht Positionen, Bauaktivitäten und Objekte.\n` +
                `Basen mit Flagge haben einen Raid-Alarm. Leugnen ist zwecklos – die Logs speichern alles.\n\n` +
                `**🛡️ Admins im Einsatz**\n` +
                `Admins im Dienst tragen Warnwesten.\n` +
                `Deren Fahrzeuge und Personen sind unantastbar (kein Diebstahl, kein Beschuss).\n` +
                `*Warnwesten sind nicht lootbar.*\n\n` +
                `**📹 Clip-Pflicht**\n` +
                `Kein Support ohne Beweis. Szenen müssen ungeschnitten, mit Ton und inkl. der 30 Sekunden vor der Situation eingereicht werden.\n\n` +
                `⚠️ **# ZEUGENAUSSAGEN ALLEIN REICHEN NICHT!**`)
            .setTimestamp();

        await message.channel.send({ embeds: [infoEmbed] }).catch(console.error);
        await message.delete().catch(console.error);
    }

    // 4. !postkonzept
    if (message.content === '!postkonzept') {
        const konzeptEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🎴 PROJECT NECRO: AETERNA')
            .setDescription(`**Überlebe den Parasiten. Beherrsche die Sektoren.**\n\n` +
                `Die Welt, wie du sie kanntest, ist am Ende. Der Necro-Parasit hat das Festland in ein lebendes Grab verwandelt. Deine einzige Hoffnung? Die Insel. Deine einzige Chance? Absolute Disziplin.\n\n` +
                `### 🎖️ DAS PROTOKOLL & DIE QUARANTÄNE-ZONE (UN & US ARMY)\n` +
                `Du startest im Staub des Festlands. Die US Army hält hier mit eiserner Hand die Stellung, während die UN die lebenswichtigen Extrahierungen durchführt. Bestehe die Quarantäne, beweise deinen Wert und werde Teil der Gemeinschaft – oder verrotte im Dreck.\n\n` +
                `### ⚙️ SEKTOREN & SYNERGIEN\n` +
                `Wir sind keine Gruppe von Glücksrittern. Wir sind eine Maschine. Wähle deine Bestimmung:\n` +
                `• **Jäger:** Die einzige Einheit mit der Lizenz für Fleisch & Leder vom Festland.\n` +
                `• **Handwerker:** Meister über Stahl, Holz und die Wartung unserer Waffen.\n` +
                `• **Bauern & Fischer:** Das Rückgrat unserer Ernährung.\n` +
                `• **Runner:** Die Lebensader, die Technik aus der Todeszone birgt.\n\n` +
                `### 🖤 DER SCHATTEN-KODEX (SCHWARZMARKT)\n` +
                `Hinter den Kulissen der Sektoren existiert ein zweites System. Der Schwarzmarkt bietet Quests für diejenigen, die bereit sind, das Gesetz zu biegen. Hier handelst du mit Waffen, Munition und illegaler Medizin. Aber Vorsicht: Verrat wird mit der Jagd belohnt.\n\n` +
                `### ☣️ DIE BEDROHUNG\n` +
                `Es sind nicht nur die Infizierten und der Parasit. Skrupellose Banditen lauern in den Ruinen des Festlands, bereit, dir für eine Dose Antibiotika die Kehle durchzuschneiden.\n\n` +
                `### 💎 DEINE VORTEILE\n` +
                `• **Perfekte Steuerung:** Vollständig optimiert für Maus & Tastatur.\n` +
                `• **Hardcore RP & Survival:** Ein tiefgreifendes Wirtschaftssystem, in dem jeder Sektor von den anderen abhängt.\n` +
                `• **Aktives Team:** Ein erfahrenes Server-Team sorgt für flüssiges Gameplay und dynamische Events.\n` +
                `• **Fortschritt:** Werde vom mittellosen Survivor zur einflussreichen Instanz der Sektoren.`)
            .setTimestamp();

        await message.channel.send({ embeds: [konzeptEmbed] }).catch(console.error);
        await message.delete().catch(console.error);
    }

    // 5. !postregeln
    if (message.content === '!postregeln') {
        const embed1 = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📜 PROJECT NECRO – SERVERREGELN & PROTOKOLL')
            .setImage(BILD_REGELN_URL)
            .setDescription(`*Hier regieren Funktion und Ordnung – oder das nackte Überleben im Schlamm.*\n*Mit der Teilnahme am Projekt akzeptierst du folgende Regeln:*\n\n` +
                `### ⚖️ Verhaltensregeln\n` +
                `* **🔞 Volljährigkeit (18+):** Nur volljährige Personen dürfen Teil dieser Community sein. Keine Ausnahmen.\n` +
                `* **🤝 Respekt & Etikette:** Diskussionen sind willkommen, solange sie respektvoll bleiben. Rassistische, sexistische oder homophobe Äußerungen führen zum Ausschluss.\n` +
                `* **🚫 Kein Dating-Portal:** Unsere Mitglieder sind keine Zielscheibe für Flirts. Belästigung wird nicht toleriert.\n` +
                `* **⏳ Geduld im Support:** Support braucht Zeit. Das echte Leben (RL) hat immer Vorrang.\n\n` +
                `### 🎭 Roleplay und Charakter\n` +
                `* **💀 Life Rule (Der endgültige Tod):** RP-Tod bei Kopfschuss im Kampf, Krieg oder formeller Hinrichtung. (*Ausnahme: Bug- oder KOS-Tode mit Clip-Pflicht!*)\n` +
                `* **⏳ Sperre:** Nach einem Tod gilt eine **3-tägige Sperre** für die Rückkehr zum alten Lager!\n` +
                `* **🩹 Verletzungen & NPC-Kills:** Verletzungen müssen ausgespielt werden. Das Töten von NPCs (Bots) wird mit Bann bestraft.\n` +
                `* **🧠 Meta-Gaming:** Nur Ingame-Wissen nutzen. RP-Flucht ist untersagt.\n` +
                `* **💰 Fairplay bei Crime:** Raubüberfälle erlaubt, aber das Opfer braucht Überlebenschancen. Lasst ihm mindestens Messer und Schuhe.\n` +
                `* **📻 Funk-Etikette:** Regulärer Funk nur mit Gerät. Notfunk ohne Gerät nur bei akuter Lebensgefahr.`);

        const embed2 = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`### 🚗 Fahrzeuge\n` +
                `* **🛠️ Verfügbarkeit & Limit:** Jedes Sektor-Lager darf maximal **1 Auto und 1 LKW** besitzen.\n` +
                `* **🔒 Diebstahlschutz:** Verschlossen und tabu bei Flaggen-Lagern oder am Schwarzmarkt.\n` +
                `* **💥 Überfälle:** Nicht auf Insassen schießen! Nutzt Reifenbeschuss oder Straßensperren.\n\n` +
                `### 🪖 DIE SEKTOR-ORDNUNG (AETERNA)\n` +
                `* **⚙️ Funktionspflicht:** Einstufung nach Fähigkeiten. Wer nichts tut, isst nichts.\n` +
                `* **📉 Status-Verlust & Degradierung:** Fehlverhalten führt zur Verbannung aufs Festland.\n` +
                `* **🌲 Die Wilden:** Haben keinen Schutzanspruch. Verstecken verboten.\n` +
                `* **🚨 Extraktions-Zone:** Am roten Licht (Flare) herrscht striktes Waffenverbot.`);

        const embed3 = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`### 🗺️ Die Karte & Gebietsstatus\n` +
                `* **🟢 SAFESPOTS – Der Schwarzmarkt:** Waffenruhe. Keine Kämpfe, kein Raub.\n` +
                `* **🔵 UN-HOHEIT:** Kamyshovo und VMC. Waffenverbot für Zivilisten. Schmuggelware verboten.\n` +
                `* **🔴 BANDITEN-HOHEIT:** Flanders Territorium. Gesetzlos. Betreten auf eigene Gefahr.\n` +
                `* **⚫ US ARMY SPERRZONE:** Kaserne Krasnostav. Unbefugtes Betreten führt zu Waffengewalt.\n\n` +
                `### ⛺ Lager & Unterschlupf\n` +
                `* **📝 Anmeldung:** Lagercode per Ticket einreichen. Kein permanenter Gebäudebau, Wachtürme verboten.\n` +
                `* **🚩 Flaggen:** Nur offizielle Flaggen-Lager sind geschützt. Raids darauf sind untersagt.\n` +
                `* **🪵 Wilderer-Lager:** Nur zum Aufwärmen, kein permanenter Wohnsitz.\n\n` +
                `*Hinweis: Insel-Bewohner entscheiden selbst über den Umgang mit Unregistrierten.*`)
            .setTimestamp();

        await message.channel.send({ embeds: [embed1, embed2, embed3] }).catch(console.error);
        await message.delete().catch(console.error);
    }

    // 6. !postschlusswort
    if (message.content === '!postschlusswort') {
        const schlusswortEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📝 SCHLUSSWORT')
            .setDescription(`Unwissenheit schützt vor Strafe nicht.\nWer hier spielt, akzeptiert die Regeln.\n\n**Bist du bereit?**\n\nKlicke unten auf den Button **"Ich akzeptiere die Regeln"**.\nÖffne ein Ticket unter <#1295683276434047009> und fülle das Formular aus.\n\nViel Erfolg beim Überleben.\n*Dein Project Necro Team*`)
            .setTimestamp();

        const button = new ButtonBuilder().setCustomId('accept_rules').setLabel('Ich akzeptiere die Regeln').setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder().addComponents(button);

        await message.channel.send({ embeds: [schlusswortEmbed], components: [row] }).catch(console.error);
        await message.delete().catch(console.error);
    }

    // 7. !postticket
    if (message.content === '!postticket') {
        const ticketEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🎫 TICKET-SYSTEM | PROJECT NECRO')
            .setDescription(`**Willkommen in der zentralen Anlaufstelle von Project Necro.**\n\nWähle unten die passende Schaltfläche, um ein privates Ticket zu eröffnen.\n\n` +
                `🌐 **DEINE OPTIONEN:**\n\n` +
                `🔹 **SUPPORT KONTAKTIEREN**\nNutze diesen Kanal für allgemeine Fragen zum Server, Hilfe bei Discord-Mechaniken oder allgemeine Anliegen.\n\n` +
                `🔻 **MELDEN**\nHier werden Verstöße gegen das Regelwerk bearbeitet. (*Clip-Pflicht!*)\n\n` +
                `🔸 **ADMIN KONTAKTIEREN**\nExklusiv für kritische Vorfälle, schwere technische Fehler oder persönliche Angelegenheiten der Projektleitung.`);

        const btnSupport = new ButtonBuilder().setCustomId('ticket_support').setLabel('Support kontaktieren').setStyle(ButtonStyle.Primary);
        const btnReport = new ButtonBuilder().setCustomId('ticket_report').setLabel('Melden').setStyle(ButtonStyle.Danger);
        const btnAdmin = new ButtonBuilder().setCustomId('ticket_admin').setLabel('Admin kontaktieren').setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(btnSupport, btnReport, btnAdmin);

        await message.channel.send({ embeds: [ticketEmbed], components: [row] }).catch(console.error);
        await message.delete().catch(console.error);
    }

    // 8. !postnotfunk
    if (message.content === '!postnotfunk') {
        const notfunkEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📻 NOTFUNK ZENTRALE')
            .setDescription(`**Hier spricht die Notfall-Leitstelle.**\n*Sie greifen auf eine offene Frequenz zu.*\n\nWählen Sie die entsprechende Kategorie für Ihren Notruf.\n\n🌐 **OPTIONEN:**\n\n🚨 **Medizinischer Notfall**\nSchwere Verletzungen, Bewusstlosigkeit oder Infektionsverdacht.\n\n🪖 **Unterstützung angefordert**\nÜberfall, feindliche Kontakte oder akute Bedrohung der Sicherheit.`);

        const btnMed = new ButtonBuilder().setCustomId('notfunk_med').setLabel('🚨 Medizinischer Notfall').setStyle(ButtonStyle.Danger);
        const btnHelp = new ButtonBuilder().setCustomId('notfunk_help').setLabel('🪖 Unterstützung angefordert').setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(btnMed, btnHelp);

        await message.channel.send({ embeds: [notfunkEmbed], components: [row] }).catch(console.error);
        await message.delete().catch(console.error);
    }

    // 9. !spende
    if (message.content === '!spende') {
        const spendenEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('💰 PROJECT NECRO – SERVERUNTERSTÜTZUNG')
            .setDescription(`Hey Survivors!\n\nDamit Project Necro dauerhaft online bleibt und wir Features wie den 32-Slot-Server und den Raid-Bot stabil halten können, fallen monatlich Fixkosten von **35,48 €** an.\n\nJede Unterstützung ist zu 100% freiwillig. Es gibt absolut keinen Zwang und kein Pay-to-Win.\n\nWir freuen uns riesig über jeden Beitrag, egal wie klein er ist. Alles fließt direkt in die monatliche Miete. Vielen Dank an alle!`);

        const btnPaypal = new ButtonBuilder().setLabel('PayPal').setURL('https://paypal.me/dskergetkangler').setStyle(ButtonStyle.Link);
        const btnNitrado = new ButtonBuilder().setLabel('Nitrado Spendenkonto').setURL('https://server.nitrado.net/donations/donate/5264193').setStyle(ButtonStyle.Link);

        const row = new ActionRowBuilder().addComponents(btnPaypal, btnNitrado);

        await message.channel.send({ embeds: [spendenEmbed], components: [row] }).catch(console.error);
        await message.delete().catch(console.error);
    }
});

async function addToNitradoWhitelist(psnId) {
    try {
        const myServerId = '18964751'; 

        // Manche Nitrado-Endpunkte erwarten ein Array namens 'whitelist'
        await nitradoAPI.post(`services/${myServerId}/gameservers/games/whitelist`, {
            whitelist: [psnId]
        });
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Whitelisten:', error.response?.data || error.message);
        return false;
    }
}

async function addToWhitelistFTP(psnId) {
    const client = new ftp.Client();
    const possiblePaths = [
        '/dayzps/profiles/whitelist.txt',
        '/dayzps/whitelist.txt',
        '/whitelist.txt',
        '/profiles/whitelist.txt'
    ];
    
    try {
        console.log(`[FTP] Starting whitelist.txt upload for PSN: ${psnId}`);
        console.log(`[FTP] Connecting to ${process.env.FTP_HOST}...`);
        
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: false
        });
        console.log(`[FTP] ✓ Connected successfully`);

        // Versuche, die richtige Datei zu finden
        let whitelistPath = null;
        for (const path of possiblePaths) {
            try {
                console.log(`[FTP] Checking if ${path} exists...`);
                await client.downloadTo('local_whitelist.txt', path);
                whitelistPath = path;
                console.log(`[FTP] ✓ Found whitelist at ${path}`);
                break;
            } catch (e) {
                console.log(`[FTP] ✗ Not found at ${path}`);
            }
        }

        // Wenn nicht gefunden, erstelle in /dayzps/profiles/
        if (!whitelistPath) {
            console.log(`[FTP] ✓ Creating new whitelist.txt at /dayzps/profiles/whitelist.txt`);
            whitelistPath = '/dayzps/profiles/whitelist.txt';
            fs.writeFileSync('local_whitelist.txt', '');
        }

        let content = fs.readFileSync('local_whitelist.txt', 'utf8');
        console.log(`[FTP] Current content length: ${content.length} bytes`);
        content += (content ? '\n' : '') + psnId;
        console.log(`[FTP] New content length: ${content.length} bytes`);
        fs.writeFileSync('local_whitelist.txt', content);
        console.log(`[FTP] ✓ Local file updated`);

        console.log(`[FTP] Uploading to ${whitelistPath}...`);
        await client.uploadFrom('local_whitelist.txt', whitelistPath);
        console.log(`[FTP] ✓ Upload successful!`);
        return true;
    } catch (err) {
        console.error(`[FTP] ✗ ERROR: ${err.message}`);
        console.error(`[FTP] Stack: ${err.stack}`);
        return false;
    } finally {
        client.close();
        console.log(`[FTP] Connection closed`);
    }
}

async function addToWhitelistConfig(psnId) {
    const client = new ftp.Client();
    try {
        console.log(`[CONFIG] Starting serverDZ.cfg upload for PSN: ${psnId}`);
        console.log(`[CONFIG] Connecting to ${process.env.FTP_HOST}...`);
        
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: false
        });
        console.log(`[CONFIG] ✓ Connected successfully`);
        
        console.log(`[CONFIG] Downloading /dayzps/profiles/serverDZ.cfg...`);
        await client.downloadTo('serverDZ.cfg', '/dayzps/profiles/serverDZ.cfg');
        console.log(`[CONFIG] ✓ Downloaded serverDZ.cfg`);

        let data = fs.readFileSync('serverDZ.cfg', 'utf8');
        console.log(`[CONFIG] File size: ${data.length} bytes`);
        
        const regex = /^(whitelist\s+)(.*)$/m;
        const match = regex.exec(data);
        if (!match) {
            console.error(`[CONFIG] ✗ Could not find whitelist line in config!`);
            return false;
        }
        console.log(`[CONFIG] Found whitelist line: "${match[0]}"`);
        
        data = data.replace(regex, (m, p1, p2) => {
            const newLine = p1 + p2 + " " + psnId;
            console.log(`[CONFIG] Replacing: "${m}" → "${newLine}"`);
            return newLine;
        });

        fs.writeFileSync('serverDZ.cfg', data);
        console.log(`[CONFIG] ✓ Local file updated`);

        console.log(`[CONFIG] Uploading to /dayzps/profiles/serverDZ.cfg...`);
        await client.uploadFrom('serverDZ.cfg', '/dayzps/profiles/serverDZ.cfg');
        console.log(`[CONFIG] ✓ Upload successful!`);
        console.log(`[CONFIG] ⚠️ Server restart required for changes to take effect`);
        return true;
    } catch (err) {
        console.error(`[CONFIG] ✗ ERROR: ${err.message}`);
        console.error(`[CONFIG] Stack: ${err.stack}`);
        return false;
    } finally {
        client.close();
        console.log(`[CONFIG] Connection closed`);
    }
}

client.login(process.env.DISCORD_TOKEN);
