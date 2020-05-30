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

    generateOptionsHtml: function(optionsArray, selectedValue)
    {
        return optionsArray.reduce( (str, opt) => 
            str + "<option value='" + opt[0] + "' " + (opt[0] === selectedValue?"selected":"") + ">"
                + opt[1]
                + "</option>", "");
    }
};