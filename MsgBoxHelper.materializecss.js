var MsgBoxHelper = {

    MODAL_INFO: "modal-info",
    MODAL_ERROR: "modal-error",
    MODAL_WARNING: "modal-warning",
    MODAL_QUESTION: "modal-question",

    msgInfo: function (msgText, callback) {
        this.customMessage(msgText, ["OK"], callback, this.MODAL_INFO);
    },

    msgError: function (msgText, callback) {
        this.customMessage(msgText, ["OK"], callback, this.MODAL_ERROR);
    },

    msgWarning: function (msgText, callback) {
        this.customMessage(msgText, ["OK"], callback, this.MODAL_WARNING);
    },

    msgAsk: function (msgText, callback) {
        this.customMessage(msgText, ["Sim", "Não"], function (button) {
            if (Br1Helper.isFunction(callback))
                callback(button === 0);
        }, this.MODAL_QUESTION);
    },

    msgConfirm: function (msgText, callback) {
        this.customMessage(msgText, ["OK", "Cancelar"], function (button) {
            if (Br1Helper.isFunction(callback))
                callback(button === 0);
        }, this.MODAL_QUESTION);
    },

    customMessage: function (msg, buttons, callback, contentClassName) {
        let msgBox = $(".message-box");               
        msgBox.remove();

        let sHtml = `<div class='modal message-box ${contentClassName}'>
                        <div class='modal-content'></div>
                        <div class='modal-footer'></div>
                    </div>`;
        msgBox = $(sHtml);

        $("body").append(msgBox);

        M.Modal.init(msgBox[0], {
            dismissible: false,
            onCloseEnd: function () {
                let clickedIndex = parseInt(msgBox.data("clickedIndex"), 10);
                if (Br1Helper.isFunction(callback))
                    callback(clickedIndex);
            }
        });

        msgBox.find(".modal-content").html(msg);

        var footer = msgBox.find(".modal-footer");
        footer.empty();
        for (var i = 0; i < buttons.length; i++)
            footer.append(
                $("<a>")
                    .attr("href", "#!")
                    .data("button-index", i)
                    .addClass("modal-close waves-effect waves-green btn-flat")
                    .text(buttons[i])
                    .click(function (event) {
                        let clickedIndex = $(event.target).data("button-index");
                        let modalMsgBox = $(event.target).closest(".message-box");
                        modalMsgBox.data("clickedIndex", clickedIndex);
                    })
            );        

        let instance = M.Modal.getInstance(msgBox[0]);
        instance.open();
    }
};