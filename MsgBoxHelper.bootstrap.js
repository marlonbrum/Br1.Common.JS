var MsgBoxHelper = {
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

    customMessage: function (msg, buttons, callback)
    {
        var msgBox = $(".message-box");
        if (msgBox.length === 0)
        {
            msgBox =
                $("<div>").addClass("modal").attr("role", "dialog")
                    .append($("<div>").addClass("modal-dialog").attr("role", "document")
                        .append($("<div>").addClass("modal-content")
                            .append($("<div>").addClass("modal-body"))
                            .append($("<div>").addClass("modal-footer"))
                        )
                    );

            $("body").append(msgBox);
        }

        msgBox.find(".modal-body").html(msg);

        var footer = msgBox.find(".modal-footer");
        footer.empty();
        for (var i = 0; i < buttons.length; i++)

            footer.append(
                $("<button>")
                    .attr("type", "button")
                    .data("button-index", i)
                    .addClass("btn btn-primary")
                    .css({ minWidth: "90px" })
                    .text(buttons[i])
                    .click(function (event) {
                        var clickedIndex = $(event.target).data("button-index");
                        
                        msgBox.on('hidden.bs.modal', function (e) {
                            setTimeout(function () {
                                if (isFunction(callback))
                                    callback(clickedIndex);
                            }, 100);                        
                        });         
                        msgBox.modal("hide");
                    })
            );

        
        msgBox.modal({
            backdrop: "static",
            show: true  
        });        
    }
};