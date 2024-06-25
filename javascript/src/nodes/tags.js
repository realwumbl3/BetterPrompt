import zyX, { html, css, ZyXDomArray, ZyXArray, sleep } from '../zyX-es6.js'
import Node from '../node.js'

export default class TagsNode extends Node {
    constructor(editor, initialJson) {
        super(editor, {
            name: 'Tags Node',
            type: 'tags',
            value: [],
            ...initialJson
        })

        console.log('TagsNode', this)

        this.tags = new ZyXArray()

        html`
            <div class="TagsNodeContainer">
                <div class=TagsNode this=tags_container zyx-array="${{ array: this.tags }}"></div>
                <button this=add_tag class=Button>+</button>
            </div>
        `
            .join(this)
            .appendTo(this.nodearea)

        this.add_tag.addEventListener('click', () => this.addTag(''))

        const value = super.getJson().value
        if (value) {
            for (const tag of value) this.addTag(tag)
        }
    }

    removeTag(tag) {
        const previousTag = this.tags[this.tags.indexOf(tag) - 1]
        this.tags.remove(tag)
        tag.main.remove()
        setTimeout(() => previousTag?.focus(), 10)
    }

    addTag(tag) {
        const newTag = new Tag(this, tag)
        this.tags.push(newTag)
        return newTag
    }

    toPrompt() {
        if (this.isMuted()) return false
        return this.tags.map(tag => tag.toPrompt()).join(', ') + ", "
    }

    getJson() {
        return {
            ...super.getJson(),
            value: this.tags.map(tag => tag.value)
        }
    }


}

class Tag {
    constructor(tagNode, value) {
        this.tagNode = tagNode
        this.value = value
        this.weight = 1

        this.input = new AutoFitInput()

        html`
            <div this=main class="Tag">
                ${this.input}
                <div class="Remove" this="remove">X</div>
            </div>
        `.bind(this)

        this.input.addEventListener('input', () => this.updateTag())
        this.input.addEventListener('keydown', (e) => {
            // if enter is pressed, add a new tag
            if (e.key === 'Enter') {
                this.tagNode.addTag('')
            }
            if (e.key === 'Backspace' && this.input.value() === '') {
                if (this.tagNode.tags.length > 1) this.removeTag()
            }
            if (e.key === 'ArrowLeft' && this.input.selectionStart() === 0) {
                const previousTag = this.tagNode.tags[this.tagNode.tags.indexOf(this) - 1]
                previousTag.focus()
            }
            if (e.key === 'ArrowRight' && this.input.selectionStart() === this.input.value().length) {
                const nextTag = this.tagNode.tags[this.tagNode.tags.indexOf(this) + 1]
                nextTag.focus()
            }
        })
        this.input.set(this.value)
        this.updateTag()

        this.remove.addEventListener('click', () => this.removeTag())
    }

    toPrompt() {
        const value = this.value
        if (value.startsWith('<') && value.endsWith('>')) return value
        const underscored = value.replace(/ /g, '_')
        return underscored;
    }

    focus() {
        this.input.focus()
    }

    removeTag() {
        this.tagNode.removeTag(this)
    }

    updateTag() {
        const input_value = this.input.value().trim()
        this.value = input_value
        this.main.classList.toggle('LORA', input_value.startsWith('<') && input_value.endsWith('>'))
    }

    async onConnected() {
        await sleep(0)
        this.input.focus()
    }
}

class AutoFitInput {
    constructor({ placeholder = "enter tag" } = {}) {
        // put an invisible span in the input to measure the text width
        html`
            <span class=AutoFitInput>
                <span this=span>${placeholder}</span>
                <input this=input type="text" placeholder="${placeholder}"/>
            </span>
        `.bind(this)
        this.input.addEventListener('input', () => this.updateSpan())
    }

    focus() {
        this.input.focus()
    }

    addEventListener(...args) {
        this.input.addEventListener(...args)
    }

    set(value) {
        this.input.value = value
        this.updateSpan()
    }

    value() {
        return this.input.value
    }

    selectionStart() {
        return this.input.selectionStart
    }

    updateSpan() {
        this.span.textContent = this.input.value < 1 ? this.input.placeholder : this.input.value
    }
}
