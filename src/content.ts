import {Translation, WordTranslationResult} from "@/WordTranslation.ts";

(function () {

    function isIn(rect: DOMRect, x: number, y: number) {
        return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom
    }

    const div = document.createElement('div')
    document.body.append(div)
    div.className     = 'translations'
    div.style.display = 'none'

    function setAttrPrefix(div: HTMLDivElement, prefix: string) {
        div.setAttribute('data-prefix', prefix)
    }

    function clear() {
        div.style.display = 'none'
    }

    window.addEventListener('mousemove', function (e: MouseEvent) {
        div.style.left = e.pageX + 'px'
        div.style.top  = e.pageY + 'px'

        let x = e.clientX
        let y = e.clientY
        let r = document.caretRangeFromPoint(x, y)
        if (!r) {
            return clear();
        }

        let tn = r.startContainer as Text
        if (tn.nodeType !== Node.TEXT_NODE) {
            return clear();
        }
        let rect = tn.parentElement!.getBoundingClientRect()
        if (!isIn(rect, x, y)) {
            return clear();
        }
        let texts = tn.textContent ?? ""
        let word  = ''
        let start = 0
        let end   = 0

        function isWord(code: number) {
            return code === 45 || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
        }

        while (start < texts.length) {
            while (start < texts.length && !isWord(texts.charCodeAt(start)))
                start++
            end = start
            while (end < texts.length && isWord(texts.charCodeAt(end)))
                end++
            let textRange = document.createRange()
            textRange.setStart(tn, start)
            textRange.setEnd(tn, end)
            let textRect = textRange.getBoundingClientRect()
            if (isIn(textRect, x, y)) {
                word = texts.slice(start, end).toLowerCase()
                break
            }
            start = end + 1
        }
        if (!word) {
            return clear();
        }

        chrome.runtime.sendMessage(word, (r?: WordTranslationResult) => {
            if (!r)
                return;
            while (div.firstChild) {
                div.removeChild(div.firstChild);
            }
            div.style.display = 'block'

            for (let word in r) {
                let t                    = r[word]
                const translationDiv     = document.createElement('div')
                translationDiv.className = 'translation'
                const wordDiv            = document.createElement('div')
                wordDiv.className        = 'word'
                wordDiv.innerText        = word
                translationDiv.append(wordDiv)
                div.append(translationDiv)

                function show(name: string, ts?: Translation) {
                    if (!ts) {
                        return
                    }
                    let v = document.createElement('div')
                    setAttrPrefix(v, name)
                    v.style.display = 'block'
                    v.innerText     = ts.translation.join('； ')
                    translationDiv.append(v)
                }

                for (let name in t) {
                    show(name, t[name])
                }
            }
        })
    })
})()
