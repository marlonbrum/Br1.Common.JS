var MsgBoxHelper = {
    __defaultOptions: {},

    setOptions(options) {
        this.__defaultOptions = options;
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

    customMessage: function (content, buttons, callback, options)
    {       
        let opt = {};
        Object.assign(opt, this.__defaultOptions);  
        Object.assign(opt, options);

        let msgBox = jQuery(".message-box");
        if (msgBox.length == 0)
        {            
            msgBox = jQuery("<div>"); 
            msgBox.addClass("message-box");
            jQuery(document.body).append(msgBox);
        }

        msgBox.empty();
        let divContent = jQuery("<div class='message-content'>");
        msgBox.append(divContent);

        if (typeof content === "string")
            divContent.text(content);
        else
            divContent.append(content); // TODO: Aqui estou passando um objeto puro, verificar se precisa ser Jquery
    
        let buttonBar = jQuery("<div class='buttons'>");
        msgBox.append(buttonBar);
       

        for (let i=0; i < buttons.length; i++)
        {
            let btn = jQuery("<button class='botao'>");
            buttonBar.append(btn);
            btn.text(buttons[i]);
            btn.data("idx", i);

            if (opt !== undefined && opt.buttonClass !== undefined)
                btn.addClass(opt.buttonClass);

            btn.click(function(event) {
                let botao = jQuery(event.target);
                let idx = botao.data("idx");
                botao.closest(".message-box").data("button_idx", idx); 1

                jQuery.modal.close();     
            });
        }
    
        msgBox.modal({ 
            showClose: false,
            escapeClose: false,  
            clickClose: false   
        });

        msgBox.unbind(jQuery.modal.AFTER_CLOSE);

        msgBox.bind(jQuery.modal.AFTER_CLOSE, function(event, modal) {
            let idx = modal.elm.data("button_idx");
            setTimeout(function() {
                if(callback != null)
                    callback(idx);
            }, 100);
        });       
    }
};