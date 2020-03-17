function br1_autocomplete(inp, arr) 
{
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;

    // for (var i=0; i < arr.length; i++)
    //     arr[i] = arr[i].toUpperCase();

    /*execute a function when someone writes in the text field:*/
    jQuery(inp).data("sourceArray", arr);
    
    inp.addEventListener("input", function (e) { br1_autocomplete_call(this); });
    
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) 
    {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } 
        else if (e.keyCode == 38) 
        { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } 
        else if (e.keyCode == 13) 
        {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) 
    {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) 
    {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) 
    {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });

    var timeOutRef = null;

    function br1_autocomplete_call(target_input)
    {
        if (timeOutRef != null)
            clearTimeout(timeOutRef);

        timeOutRef = setTimeout(() => {
            timeOutRef = null;
            br1_autocomplete_execute(target_input);
        }, 500);
    }

    function br1_autocomplete_execute(target_input)
    {
        var a, b, i, val = target_input.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");

        a.addEventListener("mousedown", function(e2) {
            // cancela a gravação para deixar pra gravar depois que clicar no item selecionado.
            target_input.setAttribute('br1-cancelar', 'S');
        });
        a.setAttribute("id", target_input.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        target_input.parentNode.appendChild(a);
        var valorM = val.toUpperCase();
        let arr = jQuery(target_input).data("sourceArray");

        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) 
        {
            let arrM = arr[i].toUpperCase();

            /*check if the item starts with the same letters as the text field value:*/
            // if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) 
            if (arrM.indexOf(valorM) > -1) 
            {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/

                let html = "";
                let lastPos = 0;
                let pos = arrM.indexOf(valorM);
                while (pos > -1) {
                    if (lastPos < pos)
                        html += arr[i].substring(lastPos, pos);
                    
                    html += "<strong>" + arr[i].substr(pos, val.length) + "</strong>";
                    lastPos = pos + val.length;

                    pos = arrM.indexOf(valorM, lastPos);
                }
                if (lastPos < arr[i].length)
                    html += arr[i].substr(lastPos);

                b.innerHTML = html;

                //b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                //b.innerHTML += arr[i].substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) 
                {
                    /*insert the value for the autocomplete text field:*/
                    Br1Helper.changeValue(inp, this.getElementsByTagName("input")[0].value);
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                   // gravarCampo(inp);// Grava o campo no banco
                });
                
                a.appendChild(b);
            }
        }
    }
}