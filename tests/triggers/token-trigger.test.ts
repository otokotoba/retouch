/* eslint-disable @typescript-eslint/unbound-method */
import { expect } from 'chai';
import { Locale } from 'discord.js';
import * as sinon from 'sinon';

import { TriggerHandler } from '../../src/events/trigger-handler.js';
import { EventData } from '../../src/models/internal-models.js';
import { TokenTrigger } from '../../src/triggers/token-trigger.js';
import { FormatUtils } from '../../src/utils/format-utils.js';
import { DiscordMock } from '../discord-mock.js';

const URLS = [
    'https://www.google.com',
    'http://google.com/?q=some+text&param=3#dfsdf',
    'https://www.asd.google.com/search?q=some+text&param=3#dfsdf',
    'https://www.google.com/api/',
    'https://www.google.com/api/login.php',
    'https://discordjs.guide/preparations/setting-up-a-bot-application.html#your-bot-s-token',
];

const TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuYXV0aDAuY29tLyIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tL2NhbGFuZGFyL3YxLyIsInN1YiI6InVzcl8xMjMiLCJpYXQiOjE0NTg3ODU3OTYsImV4cCI6MTQ1ODg3MjE5Nn0.CA7eaHjIHz5NxeIJoFK9krqaeZrPLwmMmgI_XiQiIkQ';

describe('TokenTrigger', () => {
    const discord = new DiscordMock();
    const trigger = new TokenTrigger();

    beforeEach(() => {
        sinon
            .stub(discord.eventDataService, 'create')
            .resolves(new EventData(Locale.Japanese, Locale.Japanese));
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be triggered when a message including tokens.', () => {
        const texts = [
            TOKEN,
            FormatUtils.multiLines(Array(2).fill(TOKEN)),
            FormatUtils.multiLines([...URLS, TOKEN]),
        ];

        for (const t of texts) {
            discord.mockMessage(t);
            expect(trigger.triggered(discord.message)).to.equal(true);
        }
    });

    // TODO: update TokenTrigger.prototype.triggered
    it.skip('should be triggered when a message including URLs with tokens', () => {
        const texts = URLS.map(str => {
            const url = new URL(str);
            url.searchParams.append('token', TOKEN);
            return `${url}`;
        });

        for (const t of texts) {
            discord.mockMessage(t);
            expect(trigger.triggered(discord.message)).to.equal(true);
        }
    });

    it('should be executed when triggered.', async () => {
        const triggerHandler = new TriggerHandler([trigger], discord.eventDataService);

        sinon.stub(trigger, 'triggered').returns(true);
        sinon.stub(trigger, 'execute').resolves();
        sinon.stub(discord.message, 'guild').get(() => true);

        await triggerHandler.process(discord.message);

        sinon.assert.calledOnce(trigger.triggered as sinon.SinonStub);
        sinon.assert.calledOnce(trigger.execute as sinon.SinonStub);
    });

    it('should not be triggered when a message not including tokens.', () => {
        const texts = [FormatUtils.multiLines(URLS)];

        for (const t of texts) {
            discord.mockMessage(t);
            expect(trigger.triggered(discord.message)).to.equal(false);
        }
    });
});
