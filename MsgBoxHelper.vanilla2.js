/**
 * A primeira versão de MsgBoxHelper.vanilla.js , apesar do nome, usava jquery. 
 * Essa é uma tentativa de fazer uma msgbox sem jquery nem framework
 */

var MsgBoxHelper = {
    __defaultOptions: {
        dialogClassName: "",
        buttonClassName: "",
        onValidate: null,
        beforeShow: null
    },

    setOptions(options) {
        Object.assign(this.__defaultOptions, options);
    },

    msgInfo: function (msgText, callback, options)
    {
        MsgBoxHelper.customMessage(msgText, ["OK"], callback, options);
    },

    msgAsk: function (msgText, callback, options)
    {
        MsgBoxHelper.customMessage(msgText, ["Sim", "Não"], function (button) {
            if (Br1Helper.isFunction(callback))
                callback(button === 0);
        }, options);
    },

    msgConfirm: function (msgText, callback, options)
    {   
        MsgBoxHelper.customMessage(msgText, ["OK", "Cancelar"], function (button) {
            if (Br1Helper.isFunction(callback))
                callback(button === 0);
        }, options);
    },

    addElement: function(container, tagName, className)
    {
        let div = document.createElement(tagName);
        div.classList.add(className);
        container.appendChild(div);
        return div;
    },

    customMessage: function (content, buttons, callback, options)
    {       
        let opt = {};
        Object.assign(opt, this.__defaultOptions);  
        Object.assign(opt, options);

        let msgBox = document.querySelector(".message-box");
        if (msgBox == null)        
            msgBox = MsgBoxHelper.addElement(document.body, "div", "message-box");               

        msgBox.innerHTML = "";        
        let divContent = MsgBoxHelper.addElement(msgBox, "div", "message-content");

        if (typeof content === "string")
        {
            divContent.classList.add("message-text");
            divContent.innerHTML = content;
        }
        else
            divContent.appendChild(content);
    
        if (buttons !== null && buttons.length > 0)
        {
            let buttonBar = MsgBoxHelper.addElement(msgBox, "div", "buttons");

            for (let i=0; i < buttons.length; i++)
            {
                let btn = MsgBoxHelper.addElement(buttonBar, "button", "botao");                
                btn.innerText = buttons[i];
                btn.dataset.idx = i;

                if (opt.buttonClassName != "")
                    btn.classList.add(opt.buttonClassName);

                btn.click(function(event) {                    
                    let idx = event.target.dataset.idx;
                    let msgBox = event.target.closest(".message-box");

                    if (Br1Helper.isFunction(opt.onValidate))
                        if (!opt.onValidate(idx, msgBox))
                            return;
                    
                    Br1Modal.closeModal();
                    
                    callback(idx, msgBox);
                });
            }
        }

        if (Br1Helper.isFunction(opt.beforeShow))
            opt.beforeShow();
    
        Br1Modal.showModal(msgBox, opt);
                
        return msgBox;        
    },

    closeModal: function()
    {
        jQuery.modal.close();
    }
};