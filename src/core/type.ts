export type BackendStorage = {
    get: (key: string) => Promise<any | undefined | null>;
    set: (key: string, value: any) => Promise<void>;
};
