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
     * Adiciona um evento `submit` para todos os forms da página
     * @param {EventHandlerCallback} handler função que irá tratar o evento 
     * @returns {Br1DomHelperEvents}
     */
    onSubmit(handler)
    {
        return this.addEvent("submit", "form", handler);
    }

    /**
     * Substitui o evento `submit` do formulário informado pelo handler informado. Esse método 
     * impede que o formulário seja submetido de fato, executando apenas o handler.
     * @param {string} formSelector
     * @param {EventHandlerCallback} handler
     * @returns {Br1DomHelperEvents}      
     */ 
    replaceSubmit(formSelector, handler) {
        return Br1DomHelper.replaceSubmit(formSelector, handler);        
    }

}

/**
 * Classe com funções para tratamento de elementos Select (DropDownList, ComboBox)
 */
class Br1DomHelperSelect {
    constructor(selector, container) {
        if (selector == null)
            throw new Error("Br1DomHelper.select: O parâmetro selector não pode ser nulo.");

        if (selector instanceof HTMLSelectElement) {            
            this.container = selector.parentElement;
            this.elements = [selector];            
        }
        else
        {
            this.container = container ?? document;
            this.elements = this.container.querySelectorAll(selector);
            if (this.elements.length == 0)
                throw new Error("Br1DomHelper.select: Nenhum elemento encontrado com o seletor informado: " + selector);
        }    
    }

    /**
     * Limpa os itens da Select
     * @returns {Br1DomHelperSelect}
     */
    clear() {
        this.elements.forEach(element => element.innerHTML = "");
        return this;
    }

    addOption(value, text, selected) {
        this.elements.forEach(element => {
            let option = document.createElement("option"); 
            option.value = value;
            option.text = text;
            if (selected)
                option.selected = true;
            element.add(option);
        });
        return this; 
    }

    /**
     * Retorna o texto do 1º item selecionado
     * @returns {string}
     */
    text() {
        if (this.elements.length == 0)
            return "";
        else if (this.elements[0].options.length == 0)
            return "";
        else
            return this.elements[0].options[this.elements[0].selectedIndex].text;        
    }

    getValue() {
        if (this.elements.length == 0)
            return null;
        else if (this.elements[0].options.length == 0)
            return null;
        else
            return this.elements[0].value;        
    }

    setValue(value) {
        this.elements.forEach(element => {
            for (let i = 0; i < element.options.length; i++) {
                if (element.options[i].value == value) {
                    element.selectedIndex = i;
                    return;                    
                }
            }

            // Se não achou uma option com o valor, coloco o valor em um atributo data-, para que 
            // possa ser consultado na função addFromArray ou addFromAjax
            element.dataset.selectedValue = value;
        });
        return this;
    }

    exists() {
        return this.elements.length > 0;
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
     * @param {object|null} emptyItem Item que será adicionado no início da lista (Default null)
     * @returns {Br1DomHelperSelect}
     */
    addFromArray(array, valueField, textField, selectedValue, emptyItem = null) {
        this.clear();

        if (selectedValue == null)
            selectedValue = this.elements[0].dataset.selectedValue ?? null;        

        if (emptyItem != null)
            this.addOption("", emptyItem, false);

        array.forEach(item => {
            let selected = selectedValue != null && selectedValue == item[valueField];
            this.addOption(item[valueField], item[textField], selected);
        });
        
        this.elements.forEach(element => {                                    
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
     * @param {object|null} emptyItem Item que será adicionado no início da lista (Default null)
     * @returns {Br1DomHelperSelect}
     */
    addFromAjax(url, params, valueField, textField, selectedValue, emptyItem = null) {
        this.clear();
        this.addFromArray([{valor: 0, descricao: "Carregando..."}], "valor", "descricao", 0);
        let select = this;

        Br1AjaxHelper.get(url, params, data => {
            select.clear();
            select.sourceList = data;            
            select.addFromArray(select.sourceList, valueField, textField, selectedValue, emptyItem);
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
     * @returns {Br1DomHelperEvents} l
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

    replaceSubmit: function(formSelector, handler) {
        Br1DomHelper.addEvent("submit", formSelector, event => {        
            event.preventDefault();
            try
            {
                handler(event);
            }
            finally
            {
                return false;
            }
        });
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

    hideAndDisableAll: function(selector) {
        document.querySelectorAll(selector)
            .forEach(el => Br1DomHelper.hideAndDisable(el));
    },  

    /**
     * Exibe o container informado e habilita todos os inputs  e selects
     * dentro dele
     * @param {HTMLElement} container
     * @param {string} valor da propriedade display a ser definida 
     */
    showAndEnable: function(container, displayType = "block") {
        container.style.display = displayType;

        container.querySelectorAll("input, select")
            .forEach(el => el.disabled = false);
    },

    showAndEnableAll: function(selector, displayType = "block") {
        document.querySelectorAll(selector)
            .forEach(el => Br1DomHelper.showAndEnable(el, displayType));
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

    hideTableRows: function(selector) {
        document.querySelectorAll(selector)
            .forEach(el => el.style.display = "none");
    },

    showTableRows: function(selector) {
        document.querySelectorAll(selector)
            .forEach(el => el.style.display = "");
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

    },

    /**
     * Desabilita os botões de submit do formulário quando um submit é 
     * feito, para evitar que seja feito mais de unica vez
     */
    disableOnSubmit: function() {        

        Br1DomHelper
            .events()
            .onClick("[type=submit]", event => {
                Br1DomHelper.clickedButton = event.target.getAttribute("name"); 
                return true;               
            })
            .addEvent("submit", "form:not(.dont-disable)", event => 
            {
                event.target
                    .querySelectorAll("[type=submit]")
                    .forEach(el => {
                        // se o input submit estiver com o atributo name definido,
                        // será enviado no POST um valor com esse nome, para definir
                        // qual botão foi clicado. Se o botão for desabilitado, esse 
                        // valor não será enviado. Para que isso não gere problemas,
                        // adiciono um input hidden com o mesmo nome.
                        if (!Br1Helper.isNullOrEmpty(Br1DomHelper.clickedButton))
                        {   
                            let input = el.closest("form")
                                            .querySelector(`input[type=hidden][name=${Br1DomHelper.clickedButton}]`);
                            if (input == null)
                            {
                                input = document.createElement('input');
                                input.setAttribute("type", "hidden");
                                input.setAttribute("name", nome);
                                input.value = "";
                                frm.appendChild(input);
                            }                                         
                        }

                        el.disabled = true;
                    });
            });
    },

    reenableSubmitButtons: function() {
        document.querySelectorAll("[type=submit]")
            .forEach(el => {
                el.disabled = false;
                el.removeAttribute("disabled");
            });
    },

    objectToForm: function(obj) {
        for(let key in obj)
        {
            let element = document.getElementById(key);
            if (element != null)
            {
                if (element.tagName == "SELECT")
                    Br1DomHelper.select(element).setValue(obj[key]);                
                else if (element.classList.contains("radio-group"))
                    Br1DomHelper.setRadioList(key, obj[key]);
                else if (element.getAttribute("type") == "date")                
                    element.value = Br1Helper.dateToStrInput(Br1Helper.strToDate(obj[key]));
                else
                    element.value = obj[key];
            }
        }
    },

    formToObject: function(obj) {
        for(let key in obj)
        {
            let element = document.getElementById(key);
            if (element != null)
            {   
                if (element.classList.contains("radio-group"))
                    obj[key] = Br1DomHelper.getRadioList(key);        
                else if (element.getAttribute("type") == "date")
                {
                    if (Br1Helper.isNullOrEmpty(element.value))
                        obj[key] = null;
                    else
                    {
                        let dt = Br1Helper.strToDate(element.value);
                        obj[key] = Br1Helper.dateToStr(dt);
                    }
                }
                else
                {
                    if (Br1Helper.isNullOrEmpty(element.value))
                        obj[key] = null;
                    else
                        obj[key] = element.value;
                }
            }
        }
    },

    setRadioList: function(name, value)
    {
        if (value != null)
            document.querySelector(`input[name="${name}"][value="${value}"]`).checked = true;
    },

    getRadioList: function(name)
    {
        let element = document.querySelector(`input[name="${name}"]:checked`);
        return Br1Helper.isNullOrEmpty(element) || Br1Helper.isNullOrEmpty( element.value ) ? null : element.value;
    },

    objectToTr: function( obj )
    {
        let tr = document.createElement("tr");
        
        for(let key in obj)
            tr.innerHTML += `<td class="${key}">${obj[key] != null ? obj[key]: "" }</td>`;
            
        return tr;
    },

    isElementInViewport: function(el) {
        const rect = el.getBoundingClientRect();
        const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
        
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= viewHeight &&
          rect.right <= viewWidth
        );
    },
      
    scrollToElementIfNotVisible: function(element) {
        if (!Br1DomHelper.isElementInViewport(element)) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
    }
};