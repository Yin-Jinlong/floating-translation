import {WordTranslation, WordTranslationResult} from "./WordTranslation.ts";
import {Config, Message} from "./Message.ts";

const DefaultConfig = {
    cardColor: 'hsl(22, 68%, 90%)',
    fontColor: 'hsl(0,0%,10%)',
    showShadow: true,
} as Config

/**
 * 字典
 */
const DICTS = [
    'a', 'b', 'c', 'd', 'e',
    'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'y', 'z'
]

/**
 * 词形变化键
 */
const WORD_CHANGE_KEYS = [
    "comparative",
    "superlative",
    "plural",
    "singular",
    "present",
    "past"
] as const

/**
 * 主字典
 */
let dir        = {} as Record<string, WordTranslation>
/**
 * 词形变化字典，映射到主字典
 */
let dirChanges = {} as Record<string, Set<string>>

let settings = {
    config: Object.assign({}, DefaultConfig)
}

async function saveSettings() {
    await chrome.storage.sync.set({
        settings
    })
}

chrome.storage.local.get('settings', (res: { settings: any } | { [key: string]: any }) => {
    Object.assign(settings, res?.settings)
})

/**
 * 加载字典文件
 * @param name 字典名
 */
async function loadDict(name: string) {
    let data: Record<string, WordTranslation> = await (await fetch(chrome.runtime.getURL('dict/dict-' + name + '.json'))).json()

    /**
     * 添加到词形变化字典
     * @param k 变化
     * @param w 单词
     */
    function add(k: string, w: string) {
        let r = dirChanges[k]
        if (r) {
            r.add(w)
        } else {
            dirChanges[k] = new Set([w])
        }
    }

    // 遍历单词
    for (let word in data) {
        let wt    = data[word]
        dir[word] = wt

        /**
         * 添加所有词形变化
         * @param keys 词形变化
         */
        function addAll(keys: string[] | undefined) {
            if (!keys) {
                return
            }
            for (let c of keys) {
                add(c.toLowerCase(), word)
            }
        }

        // 遍历词性，添加变化
        for (let k in wt) {
            addAll(wt[k]?.plural)
            addAll(wt[k]?.comparative)
            addAll(wt[k]?.superlative)
            addAll(wt[k]?.past)
            addAll(wt[k]?.present)
            addAll(wt[k]?.singular)
        }
    }
}

// 递归加载所有
// 暂不支持顶级await
(function load(i: number) {
    if (i >= DICTS.length)
        return
    loadDict(DICTS[i]).then(() => {
        load(i + 1)
    })
})(0)

/**
 * 监听消息
 * @param message 消息
 * @param sender 发送者
 * @param sendResponse 回复
 */
async function onMessage(message: Message<string | boolean>, sender: chrome.runtime.MessageSender, sendResponse: (r: any) => void) {
    switch (message.content) {
        case "word":
            let word = message.data as string
            let r    = {} as WordTranslationResult & Config
            let find = dir[word]
            if (find) // 源词典里有
                r[word] = find

            // 词形变化
            let dirChange = dirChanges[word];
            dirChange?.forEach(wtn => {
                    if (!r[wtn]) { // 排除重复
                        let v = dir[wtn]
                        if (v) {
                            let o = {} as WordTranslation
                            // 遍历词性
                            for (let k in v) {
                                let item = v[k]
                                // 判断包含变化
                                for (const ck of WORD_CHANGE_KEYS) {
                                    if (item[ck]?.includes(word)) {
                                        o[k] = item
                                        break
                                    }
                                }
                            }
                            r[wtn] = o
                        }
                    }
                }
            )
            r.cardColor  = settings.config.cardColor
            r.fontColor  = settings.config.fontColor
            r.showShadow = settings.config.showShadow
            sendResponse(r)
            break
        case "card-color":
            settings.config.cardColor = message.data as string
            await saveSettings()
            break
        case "font-color":
            settings.config.fontColor = message.data as string
            await saveSettings()
            break
        case "show-shadow":
            settings.config.showShadow = message.data as boolean
            await saveSettings()
            break
        case "clear":
            settings.config = Object.assign({}, DefaultConfig)
            await saveSettings()
            break
        case "get-config":
            sendResponse(settings.config)
            break
    }
}

chrome.runtime.onMessage.addListener(onMessage)
