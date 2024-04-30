import { Message } from 'discord.js';

import { Trigger } from './trigger.js';
import { EventData } from '../models/internal-models.js';
import { Logger } from '../services/logger.js';
import { ClientUtils, MessageUtils } from '../utils/index.js';

const urlRegex =
    /(?:https?:\/\/)(?:www\.)?(?:[-a-z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b)*(?:\/[/\d\w.-]*)*(?:[?])*(?:.+)*/gi;
const tokenRegex = /[a-z\d\-._~+/]{20,}=*/gi; // The quantifier is big enough not to match ordinary English words.

export class TokenTrigger implements Trigger {
    constructor() {}

    public requireGuild = true;

    public tokens: string[] = [];

    public triggered(msg: Message<boolean>): boolean {
        const content = msg.content;

        Logger.info('message.content: ' + (content.length !== 0 ? content : 'empty'));

        if (!content) {
            return false;
        }

        const urls = Array.from(urlRegex.exec(content));
        const tokenLikes = Array.from(tokenRegex.exec(content));

        for (const t of tokenLikes) {
            for (const url of urls) {
                if (!url.includes(t)) {
                    this.tokens.push(t);
                }
            }
        }

        Logger.info(`urls: ${urls}`);
        Logger.info(`tokens: ${this.tokens}`);

        return this.tokens.length > 0;
    }

    public async execute(msg: Message<boolean>, data: EventData): Promise<void> {
        const notifyChannel = await ClientUtils.findNotifyChannel(msg.guild, data.langGuild);
        if (notifyChannel) {
            await MessageUtils.send(
                notifyChannel,
                [
                    `🚨 ${msg.author} attempted to send a message including tokens.`,
                    `tokens(only first 10 characters) : ${this.tokens.map(t => t.substring(0, 10))}`,
                ].join('\n')
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
