import { APIMessage, APIUser, Client, Message, User } from 'discord.js';

import { EventDataService } from '../src/services/event-data-service.js';

export class DiscordMock {
    public client!: Client;
    public user!: User;
    public message!: Message;
    public eventDataService!: EventDataService;

    constructor() {
        this.mockClient();
        this.mockUser();
        this.mockMessage();
        this.mockEventDataService();
    }

    private mockClient(): void {
        this.client = new Client({ intents: [] });
    }

    private mockUser(): void {
        this.user = Reflect.construct(User, [
            this.client,
            {
                id: '1',
                username: 'username',
            } as APIUser,
        ]);
    }

    public mockMessage(content: string = ''): void {
        this.message = Reflect.construct(Message<true>, [
            this.client,
            {
                id: '1',
                channel_id: '1',
                author: this.user as unknown as APIUser,
                content,
            } as APIMessage,
        ]);
    }

    private mockEventDataService(): void {
        this.eventDataService = new EventDataService();
    }
}
