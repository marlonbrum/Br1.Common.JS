var Br1Modal = {

    MODAL_CLASS: "br1-modal-dialog",
    OVERLAY_CLASS: "br1-modal-dialog-overlay",

    __defaultOptions: {
        dialogClassName: "",
        closeOnClickOutside: false,
        closeOnEscape: false
    },

    setOptions(options) {
        Object.assign(this.__defaultOptions, options);
    },

    getDiv: function(className)
    {
        let div = document.querySelector("." + className);
        if (div == null)
        {
            div = document.createElement("div");
            div.classList.add(className);
            document.body.appendChild(div);
        }
        return div;
    },

    showModal: function (content, options) {
        let opt = {};
        Object.assign(opt, this.__defaultOptions);  
        Object.assign(opt, options);

        // Cria o overlay, camada semi-transparente que fica embaixo do modal.
        let modalOverlay = Br1Modal.getDiv(Br1Modal.OVERLAY_CLASS);

        modalOverlay.style.cssText = `
            position: absolute;
            background-color: black;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 3000;
            opacity: 0.6;
        `;

        // Cria a message box
        let modalBox = Br1Modal.getDiv(Br1Modal.MODAL_CLASS);
        if (opt.dialogClassName != "")
        {
            opt.dialogClassName
                .split(' ')
                .forEach(cl => modalBox.classList.add(cl));
        }
        modalBox.style.cssText = `
            position: absolute;
            background-color: white;
            top: 50%;
            left: 50%;
            z-index: 3001;
        `;

        modalBox.innerHTML = "";
        modalBox.appendChild(content);

        modalBox.style.marginLeft = "-" + (modalBox.clientWidth / 2) + "px";
        modalBox.style.marginTop = "-" + (modalBox.clientHeight / 2) + "px";

    },

    closeModal: function()
    {
        let msgBoxOverlay = document.querySelector("." + Br1Modal.OVERLAY_CLASS);
        if (msgBoxOverlay !== null)
            msgBoxOverlay.remove();

        let msgBox = document.querySelector("." + Br1Modal.MODAL_CLASS);
        if (msgBox !== null)
            msgBox.remove();
    }
};
