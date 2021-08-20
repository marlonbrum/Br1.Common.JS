var Br1DomHelper = {
    clear: function (element) {
        while(element.firstChild)
            element.removeChild(element.firstChild);
    },

    append: function(parent, elementName, className, text)
    {
        let el = document.createElement(elementName);
        if (!Br1Helper.isNullOrEmpty(className))
            el.classList.add(className);

        if (!Br1Helper.isNullOrEmpty(text))
            el.innerText = text;

        return el;
    },

    generateOptionsHtml: function(optionsArray, selectedValue, emptyItem)
    {
        return optionsArray.reduce( (str, opt) => 
            str + "<option value='" + opt[0] + "' " + (opt[0] === selectedValue?"selected":"") + ">"
                + opt[1]
                + "</option>", 
            emptyItem ? "<option value=''></option>":"");
    },

    clearOptions: function(select)
    {
        while (select.options.length)
            select.remove(0);
    },

    addOptions: function(select, optionsArray, selectedValue, emptyItem)
    {
        Br1DomHelper.clearOptions(select);
        
        if (emptyItem)        
            select.options.add(new Option("", ""));

        for (let i=0; i < optionsArray.length; i++)
        {
            let opt = new Option(optionsArray[i], optionsArray[i]);
            if (selectedValue == opt.value)
                opt.selected = true;
            select.options.add(opt);
        }
    },

    sortSelect: function(select, sortFunction) 
    {
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
        for (var i=0;i<select.options.length;i++) 
            itens[i] = [select.options[i].value, select.options[i].text];

        itens.sort((itemA, itemB) => sortFunction(itemA[0], itemA[1], itemB[0], itemB[1]));

        while (select.options.length > 0) 
            select.options[0] = null;
        
        for (var i=0;i<itens.length;i++) 
            select.options[i] = new Option(itens[i][1],itens[i][0]);        
    },

    onDomReady: function(callback) {
        if (document.readyState === "complete" 
            || document.readyState === "loaded" 
            || document.readyState === "interactive") {
                callback();
        }
        else
            document.addEventListener("DOMContentLoaded", function(event) {
                callback(event);
            });
    },

    onClick: function(container, selector, handler)
    {
        Br1DomHelper.addEvent(container, "click", selector, handler);
    },

    onChange: function(container, selector, handler)
    {
        Br1DomHelper.addEvent(container, "change", selector, handler);
    },

    /**
     * Adiciona um handler de evento a todos os elementos do container que 
     * atendam ao seletor.
     * @param {*} container 
     * @param {*} eventName 
     * @param {*} selector 
     * @param {*} handler 
     */
    addEvent: function(container, eventName, selector, handler)
    {
        if (container == null)
            container = document;
        
        let elements = container.querySelectorAll(selector);
        for(let i=0; i < elements.length; i++)
            elements[i].addEventListener(eventName, handler);
    },

    /**
     * Limpa o elemento informado
     * @param {HTMLElement} element 
     */
    empty: function(element)
    {
        element.innerHTML = "";
    },

    create: function(tagName, className)
    {
        el = document.createElement(tagName);
        el.classList.add(className);
        return el;
    },

    /**
     * Esconde o container Informado e desabilita todos os inputs  e selects
     * dentro dele (Para não serem validados)
     * @param {HTMLElement} container 
     */
    hideAndDisable: function(container)
    {
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
    showAndEnable: function(container, displayType = "block")
    {
        container.style.display = "block";
        
        container.querySelectorAll("input, select")
            .forEach(el => el.disabled = false);
    },

    show: function(selector, visible, displayType = "block")
    {
        document.querySelectorAll(selector)
            .forEach(el => el.style.display = visible ? displayType : "none");
    },

    elementIndex: function(el) 
    {
        var i=0;
        while(el.previousElementSibling ) {
            el=el.previousElementSibling;
            i++;
        }
        return i;    
    }

};