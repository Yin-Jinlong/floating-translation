import {WordTranslation, WordTranslationResult} from "./WordTranslation.ts";
import {Message} from "./Message.ts";

const DICTS = [
    'a', 'b', 'c', 'd', 'e',
    'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'y', 'z'
]

let dir        = {} as Record<string, WordTranslation>
let dirChanges = {} as Record<string, Set<string>>

async function loadDict(name: string) {
    let data: Record<string, WordTranslation> = await (await fetch(chrome.runtime.getURL('dict-' + name + '.json'))).json()

    function add(k: string, w: string) {
        let r = dirChanges[k]
        if (r) {
            r.add(w)
        } else {
            dirChanges[k] = new Set([w])
        }
    }

    for (let word in data) {
        let wt    = data[word]
        dir[word] = wt

        function addAll(keys: string[] | undefined) {
            if (!keys) {
                return
            }
            for (let c of keys) {
                add(c.toLowerCase(), word)
            }
        }

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

(function load(i: number) {
    if (i >= DICTS.length)
        return
    loadDict(DICTS[i]).then(() => {
        load(i + 1)
    })
})(0)

function onMessage(message: Message | string, sender: chrome.runtime.MessageSender, sendResponse: (r?: WordTranslationResult) => void) {
    if (typeof message === 'string') {
        let word = message
        let r    = {} as WordTranslationResult
        let find = dir[word]
        if (find)
            r[word] = find

        let dirChange = dirChanges[word];
        dirChange?.forEach(wtn => {
                if (!r[wtn]) {
                    let v = dir[wtn]
                    if (v)
                        r[wtn] = v
                }
            }
        )
        sendResponse(r)
    }
}

chrome.runtime.onMessage.addListener(onMessage)
