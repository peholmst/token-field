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

            .token {
                background-color: greenyellow;
                border-radius: 4px;
                padding: 2px 4px;
                box-shadow: 1px 1px 2px lightgray;
                display: inline-block;
                margin-right: 5px;
                margin-bottom: 2px;
            }    
        `;
    }

    static get properties() {
        return {
            value: { type: String, observe: true },
            tokens: { type: Array },
            tokenSeparator: { type : String }
        };
    }

    constructor() {
        super();
        this.tokenSeparator = " ";
        this.tokens = [];
    }

    render() {
        return html`
            <div id="editorContainer" role="textbox" @mousedown=${this._onMouseDown}>
                ${this.tokens.map(token => this._createToken(token))}
                <input type="text" id="editor" @keydown=${this._onKeyDown}>
            </div>
        `;
    }

    _onKeyDown(event) {
        if (event.defaultPrevented) {
            return;
        }
        let editor = event.target;
        if (event.key === 'Enter' || event.key === this.tokenSeparator) {
            let token = editor.value.trim();
            if (token.length > 0) {
                this.addToken(token);
                editor.value = '';
            }
            event.preventDefault();
        } else if (event.key === 'Backspace' && editor.selectionStart == 0 && editor.selectionEnd == 0) {
            this.removeTokenByIndex(this.tokens.length -1);
            event.preventDefault();
        }
    }

    _onMouseDown(event) {
        if (event.defaultPrevented) {
            return;
        }
        let editor = this.shadowRoot.getElementById('editor');
        if (event.target !== editor) {
            editor.focus();
            event.preventDefault();
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
            this._parseTokens(this.value);
        }
    }

    addToken(token) {
        if (!this.containsToken(token)) {
            console.log(`Adding token ${token}`);
            this.tokens.push(token);
            this.requestUpdate();
        }
    }

    removeToken(token) {
        this.removeTokenByIndex(this.indexOf(token));
    }

    removeTokenByIndex(tokenIndex) {
        if (tokenIndex > -1 && tokenIndex < this.tokens.length) {
            let removed = this.tokens.splice(tokenIndex, 1);
            console.log(`Removed token ${removed} at index ${tokenIndex}`);
            this.requestUpdate();
        }
    }

    containsToken(token) {
        return this.indexOf(token) > -1;
    }

    indexOf(token) {
        return this.tokens.indexOf(token);
    }

    _parseTokens(value) {
        this.tokens = value.split(this.tokenSeparator);
    }

    _createToken(token) {
        return html`
            <div class="token">${token}</div>
        `;
    }
}

customElements.define('token-field', TokenField);