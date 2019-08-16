import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';

/**
 * `token-field`
 *
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class TokenField extends PolymerElement {

    static get template() {
        return html`
            <style>
                :host {
                    padding: var(--lumo-space-xs) 0;
                    --lumo-text-field-size: var(--lumo-size-m);
                    color: var(--lumo-body-text-color);
                    font-size: var(--lumo-font-size-m);
                    font-family: var(--lumo-font-family);
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    -webkit-tap-highlight-color: transparent;
                }

                .token-field-container {
                    display: flex;
                    flex-direction: column;
                    min-width: 100%;
                    max-width: 100%;
                    width: var(--vaadin-text-field-default-width, 12em);
                }

                [part="label"] {
                    align-self: flex-start;
                    color: var(--lumo-secondary-text-color);
                    transition: color 0.2s;
                    font-weight: 500;
                    font-size: var(--lumo-font-size-s);
                    margin-left: calc(var(--lumo-border-radius-m) / 4);
                    line-height: 1;
                    padding-bottom: 0.5em;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    position: relative;
                    max-width: 100%;
                    box-sizing: border-box;
                }

                .token-field-container [part="input-field"] {
                    flex-grow: 0;
                }

                [part="input-field"] {
                    border-radius: var(--lumo-border-radius);
                    background-color: var(--lumo-contrast-10pct);
                    padding: 0 calc(0.375em + var(--lumo-border-radius) / 4 - 1px);
                    font-weight: 500;
                    line-height: 1;
                    position: relative;
                    cursor: text;
                    box-sizing: border-box;
                    display: flex;
                    flex-wrap: wrap;
                }
                
                [part="editor"] {
                    outline: none;
                    border: none;
                    background-color: transparent;                    
                    min-height: var(--lumo-text-field-size);
                    padding: 0 0.25em;                    
                    font-size: 1em;
                    flex-grow: 1;
                    flex-shrink: 1;
                    min-width: var(--vaadin-text-field-default-width, 12em) / 4;
                }
                
                [part="editor"].inline {
                    min-width: 0.25em;
                    flex-grow: 0;
                }

                /*

                #editorContainer:focus-within {
                    outline: -webkit-focus-ring-color auto 5px;
                    outline-offset: -2px;
                }*/

                /*#editor {
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
                }*/

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
        
                #itemSelect {
                    position: absolute;
                    display: none;
                }
            </style>
            <div class="token-field-container">
                <label part="label">[[label]]</label>
                <div part="input-field" id="editorContainer" role="textbox" on-mousedown="_onMouseDown">
                    <template is="dom-repeat" items="[[tokens]]" as="token">
                        <div class="token" style="order: [[_calculateTokenOrder(index)]]" data-token$="[[token.id]]">[[token.label]]</div>
                    </template>
                    <input part="editor" type="text" id="editor" on-keydown="_onEditorKeyDown" on-input="_onEditorInput" on-blur="_onEditorBlur" on-focus="_onEditorFocus">
                    <select id="itemSelect" size="4" on-change="_onItemSelectChange"></select>
                </div>
                <div part="error-message"></div>
                <canvas id="canvas"></canvas>
            </div>
    `;
    }

    _calculateTokenOrder(index) {
        return index * 2;
    }

    static get properties() {
        return {
            items: {type: Array},
            label: {type: String},
            tokens: {type: Array},
            tokenSeparator: {type: String}
        };
    }

    constructor() {
        super();
        this.items = [];
        this.tokens = [];
        this.tokenSeparator = " ";
        this._inlineEditorPosition = -1;
    }

    ready() {
        super.ready();
        this._getEditor().style.order = Number.MAX_SAFE_INTEGER;
    }

    _onEditorKeyDown(event) {
        if (event.defaultPrevented) {
            return;
        }
        const editor = event.target;
        const cursorAtTheStart = editor.selectionStart === 0 && editor.selectionEnd === 0;
        const cursorAtTheEnd = editor.selectionStart === editor.value.length && editor.selectionEnd === editor.selectionStart;
        const editorIsEmpty = editor.value.length === 0;

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
        } else if (event.key === 'ArrowDown') {
            this._selectNextItem();
            event.preventDefault();
        } else if (event.key === 'ArrowUp') {
            this._selectPreviousItem();
            event.preventDefault();
        }
    }

    _onEditorInput(event) {
        this._updateInlineEditorWidth();
    }

    _onEditorBlur(event) {
        this._clearEditor();
        this._moveEditor(-1, false);
        this._hideItemSelect();
    }

    _onEditorFocus(event) {
        //this._showItemSelect();
    }

    _onMouseDown(event) {
        if (event.defaultPrevented) {
            return;
        }
        const editor = this._getEditor();
        const itemSelect = this._getItemSelect();
        if (event.target !== editor && event.target !== itemSelect) {
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
        return mouseEvent.target.id === 'editorContainer';
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
            this.push('tokens', token);
        }
    }

    addTokenAtPosition(token, position) {
        if (!this.containsToken(token) && position >= 0 && position <= this.tokens.length) {
            console.debug(`Adding token "${token}" to position ${position}`);
            this.splice('tokens', position, 0, token);
        }
    }

    removeToken(token) {
        this.removeTokenAtPosition(this.indexOf(token));
    }

    removeTokenAtPosition(position) {
        if (position > -1 && position < this.tokens.length) {
            const removed = this.splice('tokens', position, 1);
            console.debug(`Removed token "${removed}" at position ${position}`);
            if (this.tokens.length === 0) {
                this._moveEditor(-1);
            }
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
        if (this._inlineEditorPosition === -1) {
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
            if (width === 0) {
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

    _showItemSelect() {
        if (this.items.length > 0) {
            console.debug('Showing list of items')
            const itemSelect = this._getItemSelect();

            while (itemSelect.options.length) itemSelect.remove(0);

            this.items.forEach(item => {
                let option = document.createElement('option');
                option.value = item.id;
                option.text = item.label;
                itemSelect.add(option);
            });

            itemSelect.style.display = 'block';

            const editorBounds = this._getEditorContainer().getBoundingClientRect();
            itemSelect.style.width = editorBounds.width + 'px';
            itemSelect.style.top = editorBounds.top + editorBounds.height + 'px';
            itemSelect.style.left = editorBounds.left + 'px';
        }
    }

    _selectNextItem() {
        const itemSelect = this._getItemSelect();
        if (itemSelect.options.length > 0) {
            if (itemSelect.selectedIndex === itemSelect.options.length - 1) {
                itemSelect.selectedIndex = 0;
            } else {
                itemSelect.selectedIndex++;
            }
        }
    }

    _selectPreviousItem() {
        const itemSelect = this._getItemSelect();
        if (itemSelect.options.length > 0) {
            if (itemSelect.selectedIndex <= 0) {
                itemSelect.selectedIndex = itemSelect.options.length - 1;
            } else {
                itemSelect.selectedIndex--;
            }
        }
    }

    _hideItemSelect() {
        console.debug('Hiding list of items');
        const itemSelect = this._getItemSelect();
        itemSelect.style.display = 'none';
    }

    _onItemSelectChange(event) {
        const itemSelect = this._getItemSelect();
        if (itemSelect.selectedIndex !== -1) {
            const editor = this._getEditor();
            const selectedItem = itemSelect.item(itemSelect.selectedIndex);
            console.debug(`Selected ${selectedItem} from item list`);
            editor.value = selectedItem.text;
        }
    }

    _getTextWidthInPixels(text) {
        const ctx = this._getCanvas().getContext('2d');
        ctx.font = this._getEditor().font;
        return Math.ceil(ctx.measureText(text).width);
    }

    _getEditorContainer() {
        return this.$.editorContainer;
    }

    _getEditor() {
        return this.$.editor;
    }

    _getCanvas() {
        return this.$.canvas;
    }

    _getItemSelect() {
        return this.$.itemSelect;
    }
}

window.customElements.define('token-field', TokenField);
