function Br1AutoFilterBase(table, buttonImage) {
    this._table = table;
    this._buttonImage = buttonImage;
    this._table.autoFiltro = this;
    this._colunasIgnorar = [];
    this._filtros = [];
    this.carregar();
}

Br1AutoFilterBase.prototype.carregar = function () {
    let headers = this._table.find("thead th");
    let self = this;
    for (let index = 0; index < headers.length; index++) {
        let el = $(headers[index]);
        if (el.hasClass("nao-filtrar"))
            this._colunasIgnorar.push(index);
        else {
            let btn = el.find(".auto-filtro");
            if (btn.length > 0)
                btn.remove();
            let lnkFiltro = $("<a href='#' class='auto-filtro'>");
            el.append(lnkFiltro);
            let img = $("<img src='" + this._buttonImage + "' />");
            img.css({
                "opacity": "0.3",
                "vertical-align": "bottom"
            });
            lnkFiltro.append(img);
            lnkFiltro.click(function (event) {
                self.btnMostrarFiltroClick(event.target);
            });                
        }
    }
};

Br1AutoFilterBase.prototype.btnMostrarFiltroClick = function (botao) {
    let header = $(botao).closest("th");

    let titulo = header.text();

    let tbody = this._table.find("tbody")[0];

    // Monta lista de valores diferentes do campo
    let valores = [];
    //let colIndex = header.cellIndex;
    for (let i = 0; i < tbody.rows.length; i++) {

        if (this.isRowInFilter(tbody.rows[i], header[0].cellIndex)) {
            let valor = tbody.rows[i].cells[header[0].cellIndex].innerText;
            if (Br1Helper.isNullOrWhiteSpace(valor))
                valor = "(Vazio)";

            if (valores.indexOf(valor) === -1)
                valores.push(valor);
        }
    }

    valores = valores.sort();

    let oModal = this.createModal();

    let ul = oModal.find("ul");
    oModal.data("cellIndex", header[0].cellIndex);

    oModal.find("h4").text("Filtrar campo " + titulo);

    let liTodos = this.createListItem(ul, "- Todos -");

    liTodos.addClass("todos");
    let chkTodos = liTodos.find("input");
    let self = this;

    chkTodos.change(function (event) {
        self.chkTodosChange(event.target);
    });

    chkTodos[0].checked = true;
    for (let iValor = 0; iValor < valores.length; iValor++) {
        let chk = this.isValueInFilter(header[0].cellIndex, valores[iValor]);
        this.createListItem(ul, valores[iValor], chk);
        if (!chk)
            chkTodos[0].checked = false;
    }

    this.showModal(oModal);
};

Br1AutoFilterBase.prototype.isRowInFilter = function (row, ignoreColumn) {
    for (let c = 0; c < row.cells.length; c++) {

        if (ignoreColumn !== null && ignoreColumn !== undefined && ignoreColumn === c)
            continue;

        if (this._colunasIgnorar.indexOf(c) > -1)
            continue;

        if (!row.cells[c].classList.contains("no-filter")) {
            let valor = row.cells[c].innerText;
            if (Br1Helper.isNullOrWhiteSpace(valor))
                valor = "(Vazio)";

            if (!this.isValueInFilter(c, valor))
                return false;
        }
    }
    return true;
};

Br1AutoFilterBase.prototype.createModalBox = function () {
    // Esse método deve ser herdado na classe filha
    return null;
};

Br1AutoFilterBase.prototype.showModal = function (oModal) {
    // Esse método deve ser herdado na classe filha
    return null;
};

Br1AutoFilterBase.prototype.createModal = function () {
    let modal = $(".auto-filtro-modal");
    if (modal.length > 0)
        modal.remove();

    modal = this.createModalBox();
    modal.addClass("auto-filtro-modal");
    modal[0].autoFiltro = this;

    modal.find("ul").css({
        "overflow-y": "auto",
        "height": "315px"
    });

    $("body").append(modal);

    let self = this;

    modal.find(".btn-filtrar").click(function (event) {
        self.btnFiltrarClick(event.target);
    });
    modal.find(".btn-limpar").click(function (event) {
        self.btnLimparClick(event.target);
    });

    return modal;
};

Br1AutoFilterBase.prototype.btnFiltrarClick = function (botao) {
    let modal = $(botao).closest(".auto-filtro-modal");

    let li = modal.find("ul li:not(.todos):has(input:checked) span");
    let valores = [];
    for (let i = 0; i < li.length; i++)
        valores.push(li[i].innerText);

    let campo = modal.data("cellIndex");
    this._filtros[campo] = valores;

    this.filtrarTabela();
};

Br1AutoFilterBase.prototype.btnLimparClick = function (botao) {
    let modal = $(botao).closest(".auto-filtro-modal");

    let campo = modal.data("cellIndex");
    this._filtros[campo] = null;
    this.filtrarTabela();
};

Br1AutoFilterBase.prototype.createListItem = function (ul, valor, checked) {
    let li = $("<li class='collection-item'>");
    li.append(
        $("<label>")
            .append("<input type='checkbox' class='filled-in' " + (checked ? "checked='checked'" : "") + " />")
            .append("<span style='color: black'>" + valor + "</span>")
    );

    ul.append(li);
    return li;
};

Br1AutoFilterBase.prototype.isValueInFilter = function (cellIndex, value) {
    return !this.hasFilter(cellIndex) || this._filtros[cellIndex].indexOf(value) > -1;
};

Br1AutoFilterBase.prototype.hasFilter = function (cellIndex) {
    return Br1Helper.hasValue(this._filtros) && Br1Helper.hasValue(this._filtros[cellIndex]);
};

Br1AutoFilterBase.prototype.chkTodosChange = function (chk) {
        $(chk).closest("ul").find("li:not(.todos) input").prop("checked", chk.checked);
};

Br1AutoFilterBase.prototype.filtrarTabela = function () {

    let headers = this._table.find("thead th:has(.auto-filtro)");

    for (let index = 0; index < headers.length; index++) {
        let img = $(headers[index]).find(".auto-filtro img");

        if (this._filtros[headers[index].cellIndex] === undefined || this._filtros[headers[index].cellIndex] === null)
            img.css("opacity", "0.3");
        else
            img.css("opacity", "1");
    }

    var tBody = this._table[0].tBodies[0];

    for (let i = 0; i < tBody.rows.length; i++) {
        let rowVisible = this.isRowInFilter(tBody.rows[i], null);
        if (rowVisible)
            tBody.rows[i].style.display = "table-row";
        else
            tBody.rows[i].style.display = "none";
    }
};
