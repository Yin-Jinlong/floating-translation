export declare interface Message<T> {
    /**
     * 消息内容
     */
    content: 'word' | 'clear' | 'card-color' | 'font-color' | 'show-shadow' | 'get-config' |
        'load-dict' | 'remove-dict' | 'get-dicts'
    /**
     * 消息数据
     */
    data?: T
}

export declare interface Config {
    cardColor: string
    fontColor: string
    showShadow: boolean
}

export const DefaultConfig = {
    cardColor: 'hsl(22, 68%, 90%)',
    fontColor: 'hsl(0,0%,10%)',
    showShadow: true,
} as Config

export function sendMessage<T = void, R = any>(message: Message<T>, callback: (response: R) => void = () => {
}) {
    chrome.runtime.sendMessage<Message<T>, R>(message, callback)
}
