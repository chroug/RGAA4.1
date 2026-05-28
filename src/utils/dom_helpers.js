window.RGAA_UTILS = {
    getCssSelector: function(el) {
        if (!el) return "";
        if (el.tagName.toLowerCase() == "html") return "html";
        let str = el.tagName.toLowerCase();
        str += (el.id != "") ? "#" + el.id : "";
        
        let nomDeClasse = "";
        if (typeof el.className === 'string') {
            nomDeClasse = el.className;
        } else if (el.className && typeof el.className.baseVal === 'string') {
            nomDeClasse = el.className.baseVal;
        }

        if (nomDeClasse) {
            let classes = nomDeClasse.trim().split(/\s+/).join(".");
            str += classes ? "." + classes : "";
        }
        
        if (!el.id) {
            let parent = el.parentNode;
            if (parent && parent.tagName) {
                let index = Array.prototype.indexOf.call(parent.children, el) + 1;
                str = this.getCssSelector(parent) + " > " + str + `:nth-child(${index})`;
            }
        }
        return str;
    },

    getXPath: function(el) {
        if (!el) return "";
        if (el.id !== '') return `id("${el.id}")`;
        if (el === document.body) return el.tagName;
        let ix = 0;
        let siblings = el.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            let sibling = siblings[i];
            if (sibling === el) return this.getXPath(el.parentNode) + '/' + el.tagName + '[' + (ix + 1) + ']';
            if (sibling.nodeType === 1 && sibling.tagName === el.tagName) ix++;
        }
    },

    extraireDonneesSaaS: function(el) {
        if (!el) return {};
        const rect = el.getBoundingClientRect();
        return {
            html: (el.outerHTML || "").substring(0, 300) + '...',
            selecteur_css: this.getCssSelector(el),
            xpath: this.getXPath(el),
            bounding_box: { 
                x: Math.round(rect.x), 
                y: Math.round(rect.y), 
                width: Math.round(rect.width), 
                height: Math.round(rect.height) 
            }
        };
    }
};