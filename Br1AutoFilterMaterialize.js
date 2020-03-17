function Br1AutoFilterMaterialize(table, buttonImage) {
    Br1AutoFilterBase.call(this, table, buttonImage);
}

Br1AutoFilterMaterialize.prototype = Object.create(Br1AutoFilterBase.prototype);

Br1AutoFilterMaterialize.prototype.createModalBox = function () {
    let sHtml =
        "<div id='autoFiltroModal' class='modal'>"
        + "   <div class='modal-content'>"
        + "      <div class='titulo'>"
        + "         <h4>Filtrar campo</h4>"
        + "         <i class='material-icons modal-close'>close</i>"
        + "      </div>"
        + "      <ul class='auto-filtro-content collection'>"
        + "      </ul>"
        + "   </div>"
        + "   <div class='modal-footer'>"
        + "      <a href='#!' class='modal-close btn-filtrar waves-effect waves-green btn-flat'>Filtrar</a>"
        + "      <a href='#!' class='modal-close btn-limpar waves-effect waves-green btn-flat'>Limpar filtro</a>"
        + "   </div>"
        + "</div>";

    let modal = $(sHtml);

    modal.css({
        "width": "500px",
        "height": "450px",
        "flex-direction": "column"
    });

    modal.find(".modal-content").css({
        "flex-grow": "1",
        "padding-bottom": "0px"
    });

    modal.find(".modal-content .titulo").css({
        "display": "flex",
        "flex-direction": "row",
        "align-items": "center",
        "margin-bottom": "10px"
    });

    modal.find("h4").css({
        "font-size": "1.7em",
        "flex-grow": "1",
        "margin-bottom": "0px"
    });

    return modal;
};

Br1AutoFilterMaterialize.prototype.showModal = function (oModal) {
    oModal.modal();

    var instance = M.Modal.getInstance(oModal[0]);
    instance.open();

    oModal.css({
        "display": "flex"
    });
};