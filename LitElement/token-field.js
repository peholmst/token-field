import { LitElement, html, css } from 'lit-element';

class TokenField extends LitElement {

    static get styles() {
        return css`
            :host {
                display: inline-block;
            }

            #editorContainer {
                display: flex;
                flex-wrap: wrap;

                -webkit-appearance: textfield;
                background-color: white;
                -webkit-rtl-ordering: logical;
                cursor: text;
                padding: 2px 3px;
                border-width: 2px;
                border-style: inset;
                border-color: initial;
                border-image: initial;
                margin: 0;
                font: 400 11px system-ui;
                min-height: 19px;
            }

            #editorContainer:focus-within {
                outline: -webkit-focus-ring-color auto 5px;
                outline-offset: -2px;
            }

            #editor {
                outline: none;
                border: none;
                background: transparent;
                flex-grow: 1;
                flex-shrink: 1;
                width: 0;
                min-width: 50px;
            }

            #editor.inline {
                min-width: 5px;
                flex-grow: 0;
            }

            .token {
                background-color: lightgray;
                border-radius: 4px;
                padding: 2px 4px;
                box-shadow: 1px 1px 2px gray;
                display: inline-block;
                margin-right: 5px;
                margin-bottom: 2px;
            }    

            #canvas {
                display: none;
            }
        `;
    }

    static get properties() {
        return {
            tokens: { type: Array, attribute: false },
            tokenSeparator: { type: String, attribute: false }
        };
    }

    constructor() {
        super();
        this.tokenSeparator = " ";
        this.tokens = [];
        this._inlineEditorPosition = -1;
    }

    render() {
        return html`
            <div id="editorContainer" role="textbox" @mousedown=${this._onMouseDown}>
                ${this.tokens.map(function() {
                    let i = 0;
                    return (token) => this._createToken(token, i++);
                }.bind(this)())}
                <input type="text" id="editor" style="order: ${Number.MAX_SAFE_INTEGER}" @keydown=${this._onEditorKeyDown} @input=${this._onEditorInput} @blur=${this._onEditorBlur}>
            </div>
            <canvas id="canvas"></canvas>
        `;
    }

    _createToken(token, index) {
        return html`
            <div class="token" style="order: ${index * 2}" data-token="${token}">${token}</div>
        `;
    }

    _onEditorKeyDown(event) {
        if (event.defaultPrevented) {
            return;
        }
        const editor = event.target;
        const cursorAtTheStart = editor.selectionStart == 0 && editor.selectionEnd == 0;
        const cursorAtTheEnd = editor.selectionStart == editor.value.length && editor.selectionEnd == editor.selectionStart;
        const editorIsEmpty = editor.value.length == 0;

        if (event.key === 'Enter' || event.key === this.tokenSeparator) {
            const token = editor.value.trim();
            if (token.length > 0) {
                if (this._isInlineEditor()) {
                    this.addTokenAtPosition(token, this._inlineEditorPosition);
                    this._moveEditor(this._inlineEditorPosition + 1);
                } else {
                    this.addToken(token);
                }
                this._clearEditor();
            }
            event.preventDefault();
        } else if (event.key === 'Backspace' && cursorAtTheStart && editorIsEmpty) {
            if (this._isInlineEditor()) {
                this.removeTokenAtPosition(this._inlineEditorPosition - 1);
                this._moveEditor(this._inlineEditorPosition - 1);
            } else {
                this.removeTokenAtPosition(this.tokens.length - 1);
            }
            event.preventDefault();
        } else if (event.key === 'Delete' && cursorAtTheEnd && editorIsEmpty && this._isInlineEditor()) {
            this.removeTokenAtPosition(this._inlineEditorPosition);
            this._moveEditor(this._inlineEditorPosition);
            event.preventDefault();
        } else if (event.key === 'ArrowRight' && cursorAtTheEnd && editorIsEmpty) {
            this._moveEditorRight();
            event.preventDefault();
        } else if (event.key === 'ArrowLeft' && cursorAtTheStart && editorIsEmpty) {
            this._moveEditorLeft();
            event.preventDefault();
        }
    }

    _onEditorInput(event) {
        this._updateInlineEditorWidth();
    }

    _onEditorBlur(event) {
        this._clearEditor();
        this._moveEditor(-1, false);
    }

    _onMouseDown(event) {
        if (event.defaultPrevented) {
            return;
        }
        const editor = this._getEditor();
        if (event.target !== editor) {
            if (this._isOnToken(event)) {
                this._moveEditor(this._getPositionOfTokenElement(event.target));
            } else if (this._isBetweenTokens(event)) {
                this._moveEditor(this._getPositionOfTokenToTheLeft(event) + 1);
            }
            editor.focus();
            event.preventDefault();
        }
    }

    _isBetweenTokens(mouseEvent) {
        return mouseEvent.target.id == 'editorContainer';
    }

    _isOnToken(mouseEvent) {
        return mouseEvent.target.classList.contains('token');
    }

    _getPositionOfTokenElement(tokenElement) {
        return this.indexOf(tokenElement.dataset.token);
    }

    _getPositionOfTokenToTheLeft(mouseEvent) {
        const tokenElements = this.shadowRoot.querySelectorAll(".token");
        let position = -1;
        for (let i = 0; i < tokenElements.length; ++i) {
            const tokenX = tokenElements[i].getBoundingClientRect().left;
            if (tokenX <= mouseEvent.clientX) {
                position = i;
            } else {
                break;
            }
        }
        return position;
    }

    addToken(token) {
        if (!this.containsToken(token)) {
            console.debug(`Adding token "${token}"`);
            this.tokens.push(token);
            this.requestUpdate();
        }
    }

    addTokenAtPosition(token, position) {
        if (!this.containsToken(token) && position >= 0 && position <= this.tokens.length) {
            console.debug(`Adding token "${token}" to position ${position}`);
            this.tokens.splice(position, 0, token);
            this.requestUpdate();
        }
    }

    removeToken(token) {
        this.removeTokenAtPosition(this.indexOf(token));
    }

    removeTokenAtPosition(position) {
        if (position > -1 && position < this.tokens.length) {
            const removed = this.tokens.splice(position, 1);
            console.debug(`Removed token "${removed}" at position ${position}`);
            if (this.tokens.length == 0) {
                this._moveEditor(-1);
            }
            this.requestUpdate();
        }
    }

    containsToken(token) {
        return this.indexOf(token) > -1;
    }

    indexOf(token) {
        return this.tokens.indexOf(token);
    }

    _isInlineEditor() {
        return this._inlineEditorPosition > -1;
    }

    _moveEditorLeft() {
        if (this._inlineEditorPosition == -1) {
            this._moveEditor(this.tokens.length - 1);
        } else if (this._inlineEditorPosition > 0) {
            this._moveEditor(this._inlineEditorPosition - 1);
        }
    }

    _moveEditorRight() {
        if (this._inlineEditorPosition > -1) {
            this._moveEditor(this._inlineEditorPosition + 1);
        }
    }

    _moveEditor(position, focus = true) {
        const editor = this._getEditor();

        if (this.tokens.length > 0 && position > -1 && position < this.tokens.length) {
            console.debug(`Moving editor to position ${position}`);
            editor.style.order = (position * 2) - 1;
            editor.classList.add('inline');
            this._inlineEditorPosition = position;
        } else if (this._inlineEditorPosition > -1) {
            console.debug('Moving editor to default position');
            editor.style.order = Number.MAX_SAFE_INTEGER;
            editor.classList.remove('inline');
            this._inlineEditorPosition = -1;
        }
        if (focus) {
            editor.focus();
        }
    }

    _updateInlineEditorWidth() {
        if (this._isInlineEditor()) {
            const editor = this._getEditor();
            const width = this._getTextWidthInPixels(editor.value);
            if (width == 0) {
                editor.style.width = 0;
            } else {
                editor.style.width = `${width + 10}px`;
            }
        }
    }

    _clearEditor() {
        console.debug('Clearing editor');
        const editor = this._getEditor();
        editor.style.width = 0;
        editor.value = '';
    }

    _getTextWidthInPixels(text) {
        const ctx = this._getCanvas().getContext('2d');
        ctx.font = this._getEditor().font;   
        return Math.ceil(ctx.measureText(text).width);
    }

    _getEditorContainer() {
        return this.shadowRoot.getElementById('editorContainer');
    }

    _getEditor() {
        return this.shadowRoot.getElementById('editor');
    }

    _getCanvas() {
        return this.shadowRoot.getElementById('canvas');
    }
}

// TODO: Select tokens from list of predefined tokens, optionally allowing nonexistent tokens and even adding new ones to the list
// TODO: Test in Safari and FireFox
// TODO: Themeing
// TODO: Vaadin Flow integration
// TODO: Select multiple tokens with mouse and with keyboard

customElements.define('token-field', TokenField);