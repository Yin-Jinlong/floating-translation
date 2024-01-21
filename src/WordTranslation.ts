export type Translations = string[]

export declare interface Translation {
    translation: string[]
    comparative?: Translations
    superlative?: Translations
    plural?: Translations
    singular: Translations
    present: Translations
    past: Translations
}

export declare interface WordTranslation extends Record<string, Translation> {

}

export declare interface WordTranslationResult extends Record<string, WordTranslation>{

}
