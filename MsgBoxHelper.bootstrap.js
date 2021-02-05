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

    msgInfo: function (msgText, callback)
    {
        customMessage(msgText, ["OK"], callback);
    },

    msgAsk: function (msgText, callback)
    {
        customMessage(msgText, ["Sim", "Não"], function (button) {
            if (isFunction(callback))
                callback(button === 0);
        });
    },

    msgConfirm: function (msgText, callback)
    {   
        customMessage(msgText, ["OK", "Cancelar"], function (button) {
            if (isFunction(callback))
                callback(button === 0);
        });
    },

    customMessage: function (msg, buttons, callback, options)
    {
        let opt = {};
        Object.assign(opt, this.__defaultOptions);  
        Object.assign(opt, options);


        var msgBox = jQuery(".message-box");
        if (msgBox.length > 0)
            msgBox.remove();

        msgBox =
            jQuery("<div>").addClass("modal").addClass("message-box").attr("role", "dialog")
                .append(jQuery("<div>").addClass("modal-dialog").attr("role", "document")
                    .append(jQuery("<div>").addClass("modal-content")
                        .append(jQuery("<div>").addClass("modal-body"))
                        .append(jQuery("<div>").addClass("modal-footer"))
                    )
                );

        jQuery("body").append(msgBox);
    
        msgBox.find(".modal-content").addClass(opt.dialogClassName);

        let divContent = jQuery("<div class='message-content'>");
        
        msgBox.find(".modal-body").append(divContent);

        if (typeof msg === "string")
        {
            divContent.addClass("message-text");
            divContent.text(msg);
        }
        else
            divContent.append(jQuery(msg)); 

        //msgBox.find(".modal-body").html(msg);

        var footer = msgBox.find(".modal-footer");
        
        if (buttons === null || buttons.length == 0)
        {
            if (footer.length > 0)
                footer.remove();
        }
        else
        {
            var footer = msgBox.find(".modal-footer");
            footer.empty();
            for (var i = 0; i < buttons.length; i++)

                footer.append(
                    jQuery("<button>")
                        .attr("type", "button")
                        .data("button-index", i)
                        .addClass("btn btn-primary")
                        .addClass(opt.buttonClassName)
                        .css({ minWidth: "90px" })
                        .text(buttons[i])
                        .click(function (event) {
                            var clickedIndex = jQuery(event.target).data("button-index");

                            if (Br1Helper.isFunction(opt.onValidate))
                                if (!opt.onValidate(idx, msgBox))
                                    return;
                            
                            msgBox.on('hidden.bs.modal', function (e) {
                                setTimeout(function () {
                                    if (isFunction(callback))
                                        callback(clickedIndex);
                                }, 100);                        
                            });         
                            msgBox.modal("hide");
                        })
                );
        }
        
        msgBox.modal({
            backdrop: "static",
            show: true  
        });  
        
        return msgBox;
    },

    closeModal: function() {
        jQuery(".message-box").modal("hide");
    }
};