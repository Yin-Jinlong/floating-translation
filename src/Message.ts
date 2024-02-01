export declare interface Message<T> {
    /**
     * 消息内容
     */
    content: 'card-color' | 'font-color' | 'word' | 'clear'
    /**
     * 消息数据
     */
    data: T
}

export declare interface Config {
    cardColor: string
    fontColor: string
}
