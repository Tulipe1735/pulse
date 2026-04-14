import "dotenv/config";
export declare const producer: {
    connect: () => Promise<void>;
    send: (channel: string, message: object) => Promise<void>;
    disconnect: () => Promise<void>;
};
//# sourceMappingURL=redis.d.ts.map