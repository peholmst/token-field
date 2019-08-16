import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-icon/iron-icon.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import {ControlStateMixin} from '@vaadin/vaadin-control-state-mixin/vaadin-control-state-mixin.js';

class TokenBubbleField extends ControlStateMixin(PolymerElement) {

    static get template() {
        return html`
            <style>
                :host {
                    color: var(--lumo-body-text-color);
                    font-size: var(--lumo-font-size-m);
                    font-family: var(--lumo-font-family);
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    -webkit-tap-highlight-color: transparent;
                    outline: none;
                }
            
                .token-bubble-field-container {
                    display: flex;
                    flex-direction: column;
                }
            
                .token {
                    justify-content: space-between;
                    align-items: center;
                    display: flex;
                    border: 1px solid var(--lumo-contrast-20pct);
                    border-radius: var(--lumo-border-radius);
                    padding: 0 calc(0.375em + var(--lumo-border-radius) / 4 - 1px);
                    cursor: var(--lumo-clickable-cursor);
                    margin-right: 5px;
                }
                                
                .token:hover {
                    background-color: var(--lumo-contrast-5pct);
                    transition: background-color 0.15s ease-in-out;
                }
                
                .token iron-icon {
                    height: var(--lumo-font-size-s);
                }
                
                .token iron-icon:hover {
                    color: var(--lumo-primary-color);
                }
                
                [part="selected-tokens"] {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                }
                
                [part="selected-tokens"].separator {
                    padding-bottom: 5px;
                    margin-bottom: 5px;
                    border-bottom: 1px dashed var(--lumo-contrast-20pct);                
                }
                
                [part="selected-tokens"] .token {
                    background-color: var(--lumo-contrast-10pct);
                }
                
                [part="available-tokens"] {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                }
                
                [part="available-tokens"] .token {
                    color: var(--lumo-secondary-text-color);
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
                
                [part="label"]:empty {
                    display: none;
                }
                
                :host([focused]:not([readonly])) [part="label"] {
                    color: var(--lumo-primary-text-color);
                }
                
                :host([focused]:not([readonly])) .token.keyboard-focus {
                    box-shadow: 0 0 0 2px var(--lumo-primary-color-50pct);
                }

                :host(:hover:not([readonly]):not([focused])) [part="label"] {
                    color: var(--lumo-body-text-color);
                }
                
                [part="token-container"] {
                    outline: none;
                }
            </style>
            <div class="token-bubble-field-container" on-keydown="__onKeyDown">
                <label part="label" on-click="focus">[[label]]</label>
                <div part="token-container">
                    <div part="selected-tokens" id="selected-tokens" class$="[[__computeSelectedTokensClassName(value.*)]]">
                        <template is="dom-repeat" items="[[value]]" as="token">
                            <div class$="[[__computeTokenClassName(__focusedToken, token)]]">[[__getTokenLabel(token)]] <iron-icon icon="vaadin:close-circle" data-token$="[[token]]" on-click="__onUsedTokenClick"/></div>
                        </template>
                    </div>
                    <div part="available-tokens" id="available-tokens">
                        <template is="dom-repeat" items="[[__availableTokens]]" as="token">
                            <div class$="[[__computeTokenClassName(__focusedToken, token)]]" data-token$="[[token]]" on-click="__onAvailableTokenClick">[[__getTokenLabel(token)]]</div>
                        </template>
                    </div>
                </div>
                <div part="error-message">[[errorMessage]]</div>
            </div>
        `;
    }

    static get properties() {
        return {
            value: {
                type: Array,
                notify: true
            },
            tokens: {
                type: Array,
                notify: true
            },
            __availableTokens: {
                type: Array,
                notify: true,
                computed: '__computeAvailableTokens(value.*, tokens.*)'
            },
            __focusedToken: {
                type: String,
                notify: true,
                readonly: true
            },
            label: {
                type: String
            },
            errorMessage: {
                type: String
            }
        };
    }

    constructor() {
        super();
        this.value = [];
        this.tokens = [];
        this.__focusedToken = null;
    }

    get focusElement() {
        return this.shadowRoot.querySelector('[part="token-container"]');
    }

    _setFocused(focused) {
        super._setFocused(focused);

        if (focused && this._tabPressed) {
            this.__toggleKeyboardRow();
        } else {
            this.__focusToken(null);
        }
    }

    __computeSelectedTokensClassName(value) {
        return (value.base.length === 0 || value.base.length === this.tokens.length) ? '' : 'separator';
    }

    __computeTokenClassName(focusedToken, token) {
        return (focusedToken === token) ? 'token keyboard-focus' : 'token';
    }

    __computeAvailableTokens(value, tokens) {
        let availableTokens = [];
        let usedTokens = new Set(value.base);

        for (let i = 0; i < tokens.base.length; ++i) {
            let token = tokens.base[i];
            if (!usedTokens.has(token)) {
                availableTokens.push(token);
            }
        }

        return availableTokens;
    }

    __getTokenLabel(token) {
        return token; // TODO Implement me
    }

    __onAvailableTokenClick(event) {
        let token = event.target.dataset.token;
        this.selectToken(token);
        this.__focusToken(null);
    }

    __onUsedTokenClick(event) {
        let token = event.target.dataset.token;
        this.deselectToken(token);
        this.__focusToken(null);
    }

    selectToken(token) {
        if (this.value.indexOf(token) < 0) {
            console.debug(`Selecting token ${token}`);
            this.push('value', token);
        }
    }

    deselectToken(token) {
        let position = this.value.indexOf(token);
        if (position >= 0) {
            console.debug(`Deselecting token ${token}`);
            this.splice('value', position, 1);
        }
    }

    isTokenSelected(token) {
        return this.value.indexOf(token) >= 0;
    }

    toggleToken(token) {
        console.debug(`Toggling token ${token}`);
        let position = this.value.indexOf(token);
        if (position < 0) {
            this.push('value', token);
        } else {
            this.splice('value', position, 1);
        }
    }

    __onKeyDown(event) {
        if (event.defaultPrevented) {
            return;
        }
        if (event.key === 'ArrowRight') {
            this.__focusNextToken();
            event.preventDefault();
        } else if (event.key === 'ArrowLeft') {
            this.__focusPreviousToken();
            event.preventDefault();
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            this.__toggleKeyboardRow();
            event.preventDefault();
        } else if (event.key === ' ') {
            this.__toggleFocusedToken();
            event.preventDefault();
        }
    }

    __focusNextToken() {
        this.__moveTokenFocus(1);
    }

    __focusPreviousToken() {
        this.__moveTokenFocus(-1);
    }

    __focusToken(token) {
        if (this.__focusedToken !== token) {
            this.__focusedToken = token;
        }
    }

    __moveTokenFocus(offset) {
        if (this.__focusedToken === null) {
            if (this.value.length > 0) {
                this.__focusToken(this.value[0]);
            } else if (this.tokens.length > 0) {
                this.__focusToken(this.tokens[0]);
            }
        } else {
            let position;
            if ((position = this.value.indexOf(this.__focusedToken)) >= 0) {
                this.__focusToken(TokenBubbleField.__getArrayElement(this.value, position, offset));
            } else if ((position = this.__availableTokens.indexOf(this.__focusedToken)) >= 0) {
                this.__focusToken(TokenBubbleField.__getArrayElement(this.__availableTokens, position, offset));
            }
        }
    }

    __toggleFocusedToken() {
        if (this.__focusedToken) {
            this.toggleToken(this.__focusedToken);
        }
    }

    __toggleKeyboardRow() {
        if (this.__focusedToken === null) {
            this.__moveTokenFocus(0);
        } else if (this.value.length > 0 || this.__availableTokens.length > 0) {
            if (this.value.indexOf(this.__focusedToken) >= 0) {
                this.__focusToken(this.__availableTokens[0]);
            } else {
                this.__focusToken(this.value[0]);
            }
        }
    }

    static __getArrayElement(array, position, offset) {
        let newPosition = position + offset;
        if (newPosition < 0) {
            newPosition = array.length -1;
        } else if (newPosition >= array.length) {
            newPosition = 0;
        }
        return array[newPosition];
    }
}

window.customElements.define('token-bubble-field', TokenBubbleField);
