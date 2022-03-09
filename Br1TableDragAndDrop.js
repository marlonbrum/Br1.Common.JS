var Br1TableDragAndDrop = {
    dragSource: null,

    init: function (table) {
        
        table.querySelectorAll('thead th')
            .forEach(Br1TableDragAndDrop.prepareColumnHeader);  
    },

    prepareColumnHeader: function (th) {
        th.setAttribute('draggable', 'true');
        th.style.cursor = 'move';
        th.addEventListener('dragstart', Br1TableDragAndDrop.dragStart);
        th.addEventListener('dragend', Br1TableDragAndDrop.dragEnd);
        th.addEventListener('dragenter', Br1TableDragAndDrop.dragEnter);
        th.addEventListener('dragleave', Br1TableDragAndDrop.dragLeave);
        th.addEventListener('dragover', Br1TableDragAndDrop.dragOver);
        th.addEventListener('drop', Br1TableDragAndDrop.drop);
    },

    getCurrentTarget: function(e) {
        if (e.toElement) {
            return e.toElement;
        } else if (e.currentTarget) {
            return e.currentTarget;
        } else if (e.srcElement) {
            return e.srcElement;
        } else {
            return null;
        }
    },


    dragStart: function (e) {
        Br1TableDragAndDrop.dragSource = this;    
        console.log("dragStart");
        e.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", e.target.cellIndex.toString());
    },

    removeTargetClasses: function(target)
    {
        target.classList.remove('drag-over','insert-before','insert-after');
    },

    validateTarget: function(event) 
    {
        Br1TableDragAndDrop.removeTargetClasses(event.target);

        if (event.target.tagName == 'TH' && event.target != Br1TableDragAndDrop.dragSource)
        {
            //console.log(`dragover: ${event.layerX} / ${event.target.clientWidth}`);
            if (event.layerX < event.target.clientWidth / 2) 
                event.target.classList.add("insert-before");
            else
                event.target.classList.add("insert-after");
            
            return true;
        }
        else        
            return false;
        
    },

    dragEnter: function(e) {
        
    },

    dragLeave: function(e) {
        Br1TableDragAndDrop.removeTargetClasses(e.target);
    },

    dragOver: function(e) {
        Br1TableDragAndDrop.validateTarget(e);
        // if (Br1TableDragAndDrop.validateTarget(e))
        //     Br1TableDragAndDrop.dragSource.dataTransfer.dropEffect = "move";
        // else
        //     e.dataTransfer.dropEffect = "none";            
    },

    drop: function(e) {
        console.log("drop event");
        console.log(e);
        let row = e.target.parentElement;

        if (Br1TableDragAndDrop.validateTarget(e.target)) 
        {
            let baseChild;
            if (e.target.classList.contains("insert-before"))
                baseChild = e.target;
            else
                baseChild = e.target.nextElementSibling;
            
            row.insertBefore(Br1TableDragAndDrop.dragSource, baseChild);
        }      
        else
            e.dataTransfer.dropEffect = "none";
        
    }

};