/**
 * 消息内容
 */
export type MessageContent = 'clear' | 'card-color' | 'font-color' | 'show-shadow' | 'get-config' |
    'load-dict' | 'remove-dict' | 'get-dicts'

/**
 * 消息
 */
export declare interface Message<T> {
    /**
     * 消息内容
     */
    content: MessageContent
    /**
     * 消息数据
     */
    data?: T
}

/**
 * 配置
 */
export declare interface Config {
    /**
     * 卡片颜色
     */
    cardColor: string
    /**
     * 字体颜色
     */
    fontColor: string
    /**
     * 是否显示阴影
     */
    showShadow: boolean
}

/**
 * 默认配置
 */
export const DefaultConfig = {
    cardColor: 'hsl(22, 68%, 90%)',
    fontColor: 'hsl(0,0%,10%)',
    showShadow: true,
} as Config

/**
 * 发送消息
 * @param content 消息内容
 * @param data 消息数据
 * @param callback 回调
 */
export function sendMessage<T, R = any>(content: MessageContent, data?: T, callback: (response: R) => void = () => {
}) {
    const port = chrome.runtime.connect({name: ''})
    port.postMessage({
        content: content,
        data: data
    } as Message<T>)
    port.onMessage.addListener((response: R) => {
        callback(response)
        port.disconnect()
    })
}
