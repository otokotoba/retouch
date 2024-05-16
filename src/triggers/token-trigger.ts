import { Message } from 'discord.js';

import { Trigger } from './trigger.js';
import { EventData } from '../models/internal-models.js';
import { Logger } from '../services/logger.js';
import { ClientUtils, FormatUtils, MessageUtils } from '../utils/index.js';

const URL_REGEX =
    /(?:https?:\/\/)(?:www\.)?(?:[-a-z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b)*(?:\/[/\d\w.-]*)*(?:[?])*(?:.+)*/gi;
const TOKEN_REGEX = /[a-z\d\-._~+/]{20,}=*/gi; // The quantifier is big enough not to match ordinary English words.

export class TokenTrigger implements Trigger {
    constructor() {}

    public requireGuild = true;

    public tokens: string[] = [];

    public triggered(msg: Message<boolean>): boolean {
        this.tokens = [];
        const content = msg.content;

        if (!content) {
            return false;
        }

        const urls = Array.from(content.matchAll(URL_REGEX) ?? [], arr => arr[0]);
        const tokenLikes = Array.from(content.matchAll(TOKEN_REGEX) ?? [], arr => arr[0]);

        if (urls.length === 0) {
            this.tokens = tokenLikes;
        } else {
            for (const t of tokenLikes) {
                if (!urls.some(url => url.includes(t))) {
                    this.tokens.push(t);
                }
            }
        }

        Logger.info(FormatUtils.multiLines(['urls: ', ...urls]));
        Logger.info(FormatUtils.multiLines(['tokenLikes:', ...tokenLikes]));
        Logger.info(FormatUtils.multiLines(['tokens:', ...this.tokens]));

        return this.tokens.length > 0;
    }

    public async execute(msg: Message<boolean>, data: EventData): Promise<void> {
        const notifyChannel = await ClientUtils.findNotifyChannel(msg.guild, data.langGuild);
        if (notifyChannel) {
            await MessageUtils.send(
                notifyChannel,
                FormatUtils.multiLines([
                    `🚨 ${msg.author} attempted to send a message including tokens.`,
                    `tokens(only first 10 characters) : ${this.tokens.map(t => t.substring(0, 10)).join(', ')}`,
                ])
            );
        }

        if (msg.deletable) {
            await msg.delete();
        } else {
            await msg.reply(
                '🚨 You must not send a message including tokens. Your message will be deleted by Admin.'
            );
        }
    }
}
