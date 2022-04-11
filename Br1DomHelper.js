/**
 * Essa classe contém métodos para adicionar eventos a elementos HTML.
 */
class Br1DomHelperEvents {
    constructor(container) {
        if (container == null)
            this.container = document;
        else
            this.container = container;
    }

    /**
     * Adiciona um handler de evento a todos os elementos do container que 
     * atendam ao seletor.
     * @param {string} eventName 
     * @param {string} selector 
     * @param {EventHandlerCallback} handler
     * @returns {Br1DomHelperEvents}
     */
    addEvent(eventName, selector, handler) {
        Br1DomHelper.addEvent(eventName, selector, handler, this.container);
        return this;
    }

    /**
     * 
     * @param {string} selector 
     * @param {EventHandlerCallback} handler 
     * @returns {Br1DomHelperEvents}
     */
    onClick(selector, handler) {
        Br1DomHelper.onClick(selector, handler, this.container);
        return this;
    }

    
    /**
     * 
     * @param {string} selector 
     * @param {EventHandlerCallback} handler 
     * @returns {Br1DomHelperEvents}
     */
    onChange(selector, handler) {
        Br1DomHelper.onChange(selector, handler, this.container);
        return this;
    }

    
    /**
     * 
     * @param {string} selector 
     * @param {EventHandlerCallback} handler 
     * @returns {Br1DomHelperEvents}
     */
    onBlur(selector, handler) {
        Br1DomHelper.onBlur(selector, handler, this.container);
        return this;
    }

    /**
     * 
     * @param {EventHandlerCallback} handler 
     * @returns {Br1DomHelperEvents}
     */
    onSubmit(handler)
    {
        return this.addEvent("submit", "form", handler);
    }

}

/**
 * Classe com funções para tratamento de elementos Select (DropDownList, ComboBox)
 */
class Br1DomHelperSelect {
    constructor(selector, container) {
        
        this.container = container ?? document;

        this.elements = this.container.querySelectorAll(selector);
    }

    /**
     * Limpa os itens da Select
     * @returns {Br1DomHelperSelect}
     */
    clear() {
        this.elements.forEach(element => element.innerHTML = "");
        return this;
    }

    /**
     * Retorna o texto do item selecionado
     * @returns {string}
     */
    text() {
        if (this.elements.length == 0)
            return "";
        else
            return this.elements[0].options[this.elements[0].selectedIndex].text;        
    }

    onLoad(callback) {
        this.onLoadHandlers = this.onLoadHandlers ?? [];
        this.onLoadHandlers.push(callback); 
        return this;
    }

    /**
     * Preenche a Select com os itens do array.
     * @param {array} array Array de objetos com os valores a serem adicionados.
     * @param {string} valueField Nome do campo que contem o valor do item.
     * @param {string} textField Nome do campo que contem o texto do item.
     * @param {string} selectedValue Valor do item que deve ser selecionado.
     * @returns {Br1DomHelperSelect}
     */
    addFromArray(array, valueField, textField, selectedValue) {
        this.clear();
        this.elements.forEach(element => {
            array.forEach(item => {
                let option = document.createElement("option");
                option.value = item[valueField];
                option.text = item[textField];
                if (selectedValue != null && selectedValue == item[valueField])
                    option.selected = true;
                element.add(option);
            });

            if (this.onLoadHandlers != null)
                this.onLoadHandlers.forEach(handler => handler(element));
        });
        return this;
    }

    /**
     * Chama a url informada e preenche a Select com os dados retornados.
     * @param {string} url Url que será chamada.
     * @param {object} params Parâmetros que serão enviados na chamada.
     * @param {string} valueField Nome do campo que contem o valor do item.
     * @param {string} textField Nome do campo que contem o texto do item.
     * @param {string} selectedValue Valor do item que deve ser selecionado.
     * @returns {Br1DomHelperSelect}
     */
    addFromAjax(url, params, valueField, textField, selectedValue) {
        this.clear();
        this.addFromArray([{valor: 0, descricao: "Carregando..."}], "valor", "descricao", 0);
        let select = this;

        Br1AjaxHelper.get(url, params, data => {
            select.clear();
            select.sourceList = data;
            select.addFromArray(this.sourceList, valueField, textField, selectedValue);
        });
        return select;
    }
}

var Br1DomHelper = {
    clear: function(element) {
        while (element.firstChild)
            element.removeChild(element.firstChild);
    },

    /**
     * Retorna um contexto no DOM a partir de um elemento HTML. 
     * Todas as funções chamadas a partir desse contexto terão como 
     * @param {HTMLElement|null} container 
     * @returns {Br1DomHelperContext} l
     */
    events: function(container) {
        return new Br1DomHelperEvents(container);
    },

    /**
     * Retorna um objeto para manipulação de elementos Select.
     * @param {string} selector 
     * @param {HTMLElement|null} container 
     * @returns 
     */
    select: function(selector, container = null) {
        return new Br1DomHelperSelect(selector, container);
    },

    generateOptionsHtml: function(optionsArray, selectedValue, emptyItem) {
        return optionsArray.reduce((str, opt) =>
            str + "<option value='" + opt[0] + "' " + (opt[0] === selectedValue ? "selected" : "") + ">" +
            opt[1] +
            "</option>",
            emptyItem ? "<option value=''></option>" : "");
    },

    clearOptions: function(select) {
        while (select.options.length)
            select.remove(0);
    },

    addOptions: function(select, optionsArray, selectedValue, emptyItem) {
        Br1DomHelper.clearOptions(select);

        if (emptyItem)
            select.options.add(new Option("", ""));

        for (let i = 0; i < optionsArray.length; i++) {
            let opt = new Option(optionsArray[i], optionsArray[i]);
            if (selectedValue == opt.value)
                opt.selected = true;
            select.options.add(opt);
        }
    },

    sortSelect: function(select, sortFunction) {
        if (sortFunction == null || sortFunction == undefined)
            sortFunction = (valueA, textA, valueB, textB) => {
                let valA = textA.toUpperCase();
                let valB = textB.toUpperCase();
                if (valA === valB)
                    return 0;
                else if (valA < valB)
                    return -1;
                else
                    return 1;
            };

        let itens = new Array();
        for (var i = 0; i < select.options.length; i++)
            itens[i] = [select.options[i].value, select.options[i].text];

        itens.sort((itemA, itemB) => sortFunction(itemA[0], itemA[1], itemB[0], itemB[1]));

        while (select.options.length > 0)
            select.options[0] = null;

        for (var i = 0; i < itens.length; i++)
            select.options[i] = new Option(itens[i][1], itens[i][0]);
    },

    onDomReady: function(callback) {
        if (document.readyState === "complete" ||
            document.readyState === "loaded" ||
            document.readyState === "interactive") {
            callback();
        } else
            document.addEventListener("DOMContentLoaded", function(event) {
                callback(event);
            });
    },

    onClick: function(selector, handler, container) {
        Br1DomHelper.addEvent("click", selector, handler, container);
    },

    onChange: function(selector, handler, container) {
        Br1DomHelper.addEvent("change", selector, handler, container);
    },

    onBlur: function(selector, handler, container) {
        Br1DomHelper.addEvent("blur", selector, handler, container);
    },

    /**
     * CAllback para um EventHand.
     * @callback EventHandlerCallback
     * @param {object} event
     */

    /**
     * Adiciona um handler de evento a todos os elementos do container que 
     * atendam ao seletor.
     * @param {string} eventName 
     * @param {string} selector 
     * @param {EventHandlerCallback} handler 
     * @param {object} container 
     */
    addEvent: function(eventName, selector, handler, container) {
        if (container == null)
            container = document;

        let elements = container.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++)
            elements[i].addEventListener(eventName, handler);
    },

    /**
     * Limpa o elemento informado
     * @param {HTMLElement} element 
     */
    empty: function(element) {
        element.innerHTML = "";
    },

    create: function(tagName, className) {
        el = document.createElement(tagName);
        el.classList.add(className);
        return el;
    },

    /**
     * Esconde o container Informado e desabilita todos os inputs  e selects
     * dentro dele (Para não serem validados)
     * @param {HTMLElement} container 
     */
    hideAndDisable: function(container) {
        container.style.display = "none";

        container.querySelectorAll("input, select")
            .forEach(el => el.disabled = true);
    },

    /**
     * Exibe o container informado e habilita todos os inputs  e selects
     * dentro dele
     * @param {HTMLElement} container
     * @param {string} valor da propriedade display a ser definida 
     */
    showAndEnable: function(container, displayType = "block") {
        container.style.display = "block";

        container.querySelectorAll("input, select")
            .forEach(el => el.disabled = false);
    },

    show: function(selector, visible, displayType = "block") {
        document.querySelectorAll(selector)
            .forEach(el => el.style.display = visible ? displayType : "none");
    },

    elementIndex: function(el) {
        var i = 0;
        while (el.previousElementSibling) {
            el = el.previousElementSibling;
            i++;
        }
        return i;
    },

    /**
     * Insere o novo elemento logo após o elemento passado como referência
     * @param {HTMLElement} previousElement 
     * @param {HTMLElement} newElement 
     */
    insertAfter: function(previousElement, newElement) {
        let next = previousElement.nextElementSibling;
        if (next == null)
            previousElement.parentElement.appendChild(newElement);
        else
            previousElement.parentElement.insertBefore(newElement, next);

    }

};