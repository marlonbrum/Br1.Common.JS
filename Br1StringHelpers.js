/*************************************************************************************
 *    Polyfills para métodos de String
 *     (Um polyfill é um método que é adicionado ao tipo caso não exista, para suprir uma 
 *     incompatibilidade de browser. Se o browser já dá suporte ao método nativamente, usa-se
 *     o método do browser, caso contrário, usa-se esses.)
 *************************************************************************************/

if (!String.prototype.endsWith)
    String.prototype.endsWith = function (searchStr, Position) {
        // This works much better than >= because
        // it compensates for NaN:
        if (!(Position < this.length))
            Position = this.length;
        else
            Position |= 0; // round position
        return this.substr(Position - searchStr.length,
            searchStr.length) === searchStr;
    };

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

if (!Number.prototype.padStart) {
    Number.prototype.padStart = function padStart(targetLength, padString) {
        return this.toString().padStart(targetLength, padString);
    };
}

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength, padString) {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0, targetLength);
        }
    };
}

if (!Number.prototype.padEnd) {
    Number.prototype.padEnd = function padEnd(targetLength, padString) {
        return this.toString().padEnd(targetLength, padString);
    };
}

if (!String.prototype.removeEnd) {
    /**
     * Remove um texto do final da string caso esteja presente 
     * @param {string} final Trecho de texto que deve ser removido do final 
     * da string se estiver presente
     * @param {bool} removerEspacosVazio Se os espacos vazios no final do texto 
     * devem ser removidos antes de tratar o texto (Default false)
     * @returns {string} string com o texto removido
     */
    String.prototype.removeEnd = function (textoFinal, removerEspacosVazios) {
        if (typeof removerEspacosVazios == 'undefined')
            removerEspacosVazios = false;
        
        let s = this;
        if (removerEspacosVazios)
        {
            s = s.trim();
            textoFinal = textoFinal.trim();
        }

        if (s.endsWith(textoFinal))
            s = s.substr(0, s.length - textoFinal.length);
        
        return s;
    };
}

if (!String.prototype.maxSize)
{
    String.prototype.maxSize = function(maxSize)
    {
        if (Br1Helper.isNullOrEmpty(this))
            return this;
        else if (this.length > maxSize)
            return this.substr(0, maxSize);
        else
            return this;
    }
}

if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      'use strict';
      if (typeof start !== 'number') {
        start = 0;
      }
  
      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }