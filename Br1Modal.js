var Br1Modal = {

    MODAL_CLASS: "br1-modal-dialog",
    OVERLAY_CLASS: "br1-modal-dialog-overlay",

    __defaultOptions: {
        dialogClassName: "",
        showCloseButton: true,
        closeOnClickOutside: false,
        closeOnEscape: false        
    },

    onDialogClose: null,

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
            z-index: 3001;
        `;

        modalBox.innerHTML = "";
        if (opt.showCloseButton)
        {
            modalBox.innerHTML = 
                `<a href="#" class='modal-fechar' title='Fechar essa janela'
                    style='position: absolute; right: 5px; top: 5px; padding: 0px;'>
					<img src='${Br1Login.getGlobalVars().BaseUrl}images/close-circle-gray.png' />
				</a>`;
        }
        modalBox.appendChild(content);

        modalBox.querySelector('.modal-fechar').addEventListener('click', Br1Modal.closeButtonClick);

        Br1Modal.updateSize(modalBox);

    },

    updateSize: function(modalBox)
    {
        if (modalBox.clientWidth > (window.innerWidth - 10))
        {
            modalBox.style.left = "0px";
            modalBox.style.marginLeft = "0px";
        }
        else
        {
            modalBox.style.left = "50%";
            modalBox.style.marginLeft = "-" + (modalBox.clientWidth / 2) + "px";
        }
    
        if (modalBox)

        if (modalBox.clientHeight > window.innerHeight)
        {
            modalBox.style.top = "0px";
            modalBox.style.marginTop = "0px";
        }
        else
        {
            modalBox.style.top = "50%";
            modalBox.style.marginTop = "-" + (modalBox.clientHeight / 2) + "px";
        }
    },

    closeButtonClick: function(event)
    {
        Br1Modal.closeModal();
        event.stopPropagation();
		return false;
    },

    closeModal: function()
    {
        console.log("Br1Modal.closeModal");
        let msgBoxOverlay = document.querySelector("." + Br1Modal.OVERLAY_CLASS);
        if (msgBoxOverlay !== null)
            msgBoxOverlay.remove();

        let msgBox = document.querySelector("." + Br1Modal.MODAL_CLASS);
        if (msgBox !== null)
        {
            msgBox.remove();

            if (Br1Modal.onDialogClose != null)
                Br1Modal.onDialogClose(msgBox);
        }
    }
};
