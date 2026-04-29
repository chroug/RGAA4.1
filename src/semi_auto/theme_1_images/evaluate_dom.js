export default function extraireImagesDOM() {
    function getRealBackground(el) {
        let foundColor = 'transparent';
        let foundImage = 'none';
        let currentEl = el.parentElement;
        while (currentEl && currentEl.nodeType === 1) {
            const style = window.getComputedStyle(currentEl);
            const bgColor = style.backgroundColor;
            const bgImage = style.backgroundImage;
            if (foundColor === 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') foundColor = bgColor;
            if (foundImage === 'none' && bgImage && bgImage !== 'none') foundImage = bgImage.replace(/"/g, "'");
            if (foundColor !== 'transparent' && foundImage !== 'none') break;
            currentEl = currentEl.parentElement;
        }
        if (foundColor === 'transparent') foundColor = 'rgb(255, 255, 255)';
        return { color: foundColor, image: foundImage };
    }

    let pageTheme = "light";
    const htmlTag = document.documentElement;
    if (htmlTag.hasAttribute('data-fr-scheme')) pageTheme = htmlTag.getAttribute('data-fr-scheme'); 
    else if (htmlTag.hasAttribute('data-theme')) pageTheme = htmlTag.getAttribute('data-theme');
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) pageTheme = "dark";

    const elements = document.querySelectorAll('img, svg, [role="img"], input[type="image"]');
    const donneesImages = [];

    elements.forEach((img, index) => {
        const tagName = img.tagName.toLowerCase();
        let altText = img.getAttribute('alt') || img.getAttribute('aria-label') || img.getAttribute('title') || "";
        if (!altText && tagName === 'svg') altText = img.querySelector('title')?.textContent || "";
        
        const link = img.closest('a, button');
        const isInsideLink = link !== null;
        let linkLabel = "";
        if (isInsideLink) {
            linkLabel = (link.getAttribute('aria-label') || link.getAttribute('title') || link.innerText || "").trim();
        }

        let outerHtml = img.outerHTML;
        if ((tagName === 'img' || tagName === 'input') && img.hasAttribute('src')) {
            outerHtml = outerHtml.replace(img.getAttribute('src'), img.src); // Absolute URL
        }

        const realBackground = getRealBackground(img);
        const auditId = `audit-img-${index}`;
        img.setAttribute('data-audit-id', auditId);

        donneesImages.push({
            tagName,
            isAriaHidden: img.getAttribute('aria-hidden') === 'true',
            isInputImage: tagName === 'input' && img.getAttribute('type') === 'image',
            hasAltAttr: img.hasAttribute('alt'),
            altText,
            altNettoye: altText.toLowerCase().trim(),
            isInsideLink,
            linkLabel,
            htmlSnippet: outerHtml.substring(0, 250),
            auditId,
            type: tagName === 'svg' ? 'vecteur' : 'image',
            contextStyle: {
                themeActif: pageTheme,
                backgroundColor: realBackground.color,
                backgroundImage: realBackground.image
            },
            needsScreenshot: realBackground.image !== 'none'
        });
    });

    return donneesImages;
}