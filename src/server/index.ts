import {WordTranslation, WordTranslationResultWithConfig} from '../WordTranslation.ts'
import {DefaultConfig, Message} from '../Message.ts'
import {Dict} from '../Dict.ts'

declare interface DB {
    get<T>(key: string): Promise<T>

    set<T>(key: string, value: T): Promise<void>
}

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
    'comparative',
    'superlative',
    'plural',
    'singular',
    'present',
    'past'
] as const

let dict: Dict = {
    origin: {},
    alias: {},
    count: 0
}

let dicts: Record<string, Dict> = {
    default: {
        origin: {},
        alias: {},
        count: 0
    }
}

function init() {
    const STORE_NAME = 'floating-translation'
    const request = indexedDB.open(STORE_NAME, 1)
    request.onerror = (ev: Event) => {
        throw ev
    }

    request.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
        let db = (ev.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, {keyPath: ''})
        }
    }

    let db: IDBDatabase
    let ok: Function

    const DB: DB = {
        get<T>(key: string) {
            return new Promise<T>((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly')
                const os = transaction.objectStore(STORE_NAME)
                const request = os.get(key)
                request.onsuccess = (event) => resolve((event.target as IDBRequest).result)
                request.onerror = reject
            })
        },
        set(key: string, data: any) {
            return new Promise<void>((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly')
                const os = transaction.objectStore(STORE_NAME)
                const request = os.put(key, data)
                request.onsuccess = () => {
                    resolve()
                    transaction.commit()
                }
                request.onerror = reject
            })
        }
    }

    request.onsuccess = (ev: Event) => {
        db = (ev.target as IDBOpenDBRequest).result
        ok(DB)
    }

    return new Promise<DB>((resolve) => {
        ok = resolve
    })
}

let DB: DB

init().then((res) => {
    DB = res
    chrome.storage.local.get('settings', (res: { settings: any } | { [key: string]: any }) => {
        Object.assign(settings, res?.settings)
        DB.get<Record<string, Dict>>('dicts').then((res) => {
            dicts = Object.assign(dicts, res)
            dict = dicts[settings.useDict]
        })
    })
})

let settings = {
    config: Object.assign({}, DefaultConfig),
    useDict: 'default'
}

async function saveSettings() {
    await chrome.storage.sync.set({
        settings
    })
}

/**
 * 加载字典文件
 * @param dict 字典
 * @param data 字典数据
 */
async function loadDict(dict: Dict, data: Record<string, WordTranslation>) {
    /**
     * 添加到词形变化字典
     * @param k 变化
     * @param w 单词
     */
    function add(k: string, w: string) {
        let r = dict.alias[k]
        if (r) {
            r.add(w)
        } else {
            if (!dict.origin[k])
                dict.count++
            dict.alias[k] = new Set([w])
        }
    }

    // 遍历单词
    for (let word in data) {
        let wt = data[word]
        dict.origin[word] = wt
        if (!dict.alias[word])
            dict.count++

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
    fetch(chrome.runtime.getURL('dict/dict-' + DICTS[i] + '.json')).then((res) => {
        return res.json()
    }).then((data: Record<string, WordTranslation>) => {
        loadDict(dicts['default'], data).then(() => {
            load(i + 1)
        })
    })
})(0)

/**
 * 翻译
 * @param word 单词
 * @return 翻译&配置
 */
function translate(word: string): WordTranslationResultWithConfig {
    let r = {} as WordTranslationResultWithConfig
    let find = dict.origin[word]
    if (find) // 源词典里有
        r[word] = find

    // 词形变化
    dict.alias[word]?.forEach(wtn => {
            if (!r[wtn]) { // 排除重复
                let v = dict.origin[wtn]
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
    return r
}

chrome.runtime.onMessage.addListener((word: string, sender, sendResponse: Function) => {
    sendResponse(Object.assign(translate(word), settings.config))
})

/**
 * 监听消息
 * @param message 消息
 */
async function onMessage(message: Message<string | boolean>) {
    switch (message.content) {
        case 'card-color':
            settings.config.cardColor = message.data as string
            return saveSettings()
        case 'font-color':
            settings.config.fontColor = message.data as string
            return saveSettings()
        case 'show-shadow':
            settings.config.showShadow = message.data as boolean
            return saveSettings()
        case 'clear':
            settings.config = Object.assign({}, DefaultConfig)
            return saveSettings()
        case 'get-config':
            return settings.config
        case 'load-dict':
            const d = dicts[message.data as string]
            if (d) {
                dict = d
            }
            return dict != null
        case 'remove-dict':
            let name = message.data as string
            if (name != 'default') {
                delete dicts[name]
                return DB.set('dicts', dicts)
            }
            return false
        case 'get-dicts':
            return Object.keys(dicts).map((k) => {
                return {
                    name: k,
                    count: dicts[k].count
                }
            })
    }
}

chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((message) => {
        onMessage(message).then((r) => {
            port.postMessage(r)
        })
    })
})
