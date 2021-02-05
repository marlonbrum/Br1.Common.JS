var Br1Selectable = {
    
    /**
     * Tranforma o elemento selecionado em uma lista selecionável.
     * 
     * @param {HTMLElement} container Lista que deve se tornar selecionável 
     * @param {string} elementTagName Nome do elemento de cada item
     * @param {string} activeClass Classe que será atribuída ao item selecionado. Padrão: "active"
     */
    init: function(container, elementTagName, activeClass = "active")
    {
        container.dataset.elementTagName = elementTagName;
        container.dataset.activeClass = activeClass;

        container.classList.add("selection-container");

        this.clearSelection(container);

        container
            .querySelectorAll(container.dataset.elementTagName)
            .forEach(item => {
                item.classList.add("selection-item");
                item.addEventListener("click", Br1Selectable.itemClick);
            });
    },

    querySelected: function(container)
    {
        return container
            .querySelectorAll(container.dataset.elementTagName + "." + container.dataset.activeClass);
    },
    
    clearSelection: function(container)
    {          
        Br1Selectable
            .querySelected(container)
            .forEach(el => el.classList.remove(container.dataset.activeClass));
    },

    itemClick: function(event)
    {
        let container = event.target.closest(".selection-container");
        Br1Selectable.clearSelection(container);

        let item = event.target.closest(".selection-item");
        item.classList.add(container.dataset.activeClass);
    },

    /**
     * Obtêm o valor do item selecionado da lista.
     * O Valor será obtido através de um atributo data-value="?" no item 
     * da lista
     * Se não houverem itens selecionados, retorna null.
     * se houver apenas um item selecionado, retorna o valor do item.
     * Se houverem vários items selecionados (Ainda não suportado), retornará um array com os valores.
     * @param {HTMLElement} container Lista 
     */
    getSelectedValue: function(container)
    {
        let sel = Br1Selectable.querySelected(container);
        if (sel.length == 0)
            return null;
        else if (sel.length == 1)
            return sel[0].dataset.value;
        else
            return sel.map(i => i.dataset.value);
    }
};