/**
 * 翻译内容
 */
export type Translations = string[]
/**
 * 单词变化
 */
export type WordChanges = string[]

/**
 * 翻译
 */
export declare interface Translation {
    /**
     * 翻译
     */
    translation: Translations
    /**
     * 比较级
     */
    comparative?: WordChanges
    /**
     * 最高级
     */
    superlative?: WordChanges
    /**
     * 复数
     */
    plural?: WordChanges
    /**
     * 第三人称单数
     */
    singular: WordChanges
    /**
     * 现在分词
     */
    present: WordChanges
    /**
     * 过去式，过去分词
     */
    past: WordChanges
}

/**
 * 单词翻译
 *
 * 词性->翻译
 */
export declare interface WordTranslation extends Record<string, Translation> {

}

/**
 * 单词翻译结果
 *
 * 单词->单词翻译
 */
export declare interface WordTranslationResult extends Record<string, WordTranslation> {

}
