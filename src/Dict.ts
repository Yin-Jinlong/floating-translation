import {WordTranslation} from "@/WordTranslation.ts";

export declare interface Dict {
    origin: Record<string, WordTranslation>
    alias: Record<string, Set<string>>
    count: number
}

export declare interface DictNameWithCount {
    name: string,
    count: number
}
