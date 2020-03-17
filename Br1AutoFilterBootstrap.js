function Br1AutoFilterBootstrap(table, buttonImage) {
    Br1AutoFilterBase.call(this, table, buttonImage);
}

Br1AutoFilterBootstrap.prototype = Object.create(Br1AutoFilterBase.prototype);

Br1AutoFilterBootstrap.prototype.createModalBox = function () {
   /* let sHtml3 =
        "<div id='autoFiltroModal' class='auto-filtro-modal modal'>"
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
        + "</div>"; */

    let sHtml =
        "<div class='modal' tabindex='-1' role='dialog'>"
        + "   <div class='modal-dialog' role='document'>"
        + "       <div class='modal-content'>"
        + "           <div class='modal-header'>"
        + "                <h4 class='modal-title'>Filtrar campo</h5>"
        + "                <button type='button' class='close' data-dismiss='modal' aria-label='Close'>"
        + "                    <span aria-hidden='true'>&times;</span>"
        + "                </button>"
        + "            </div>"
        + "            <div class='modal-body'>"
        + "                 <ul class='auto-filtro-content'>"
        + "                 </ul>"
        + "            </div>"
        + "            <div class='modal-footer'>"
        + "                <button type='button' class='btn btn-primary btn-filtrar' data-dismiss='modal'>Filtrar</button>"
        + "                <button type='button' class='btn btn-primary btn-limpar' data-dismiss='modal'>Limpar</button>"
        + "            </div>"
        + "        </div>"
        + "    </div>"
        + "</div>";

    return $(sHtml);
};

Br1AutoFilterBootstrap.prototype.showModal = function (oModal) {
    oModal.modal();
};