(async function() {
    console.log("🚀 Начинаем парсинг книги с титульным листом и оглавлением...");

    const existing = document.getElementById('my-pdf-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'my-pdf-overlay';
    overlay.style.cssText = 'position: absolute; top:0; left:0; width: 100%; min-height: 100vh; z-index: 99999999; background: white; color: black; font-size: 18px; font-family: Georgia, serif; line-height: 1.6; padding: 40px; box-sizing: border-box; text-align: left; isolation: isolate; overflow-y: auto; scroll-behavior: smooth;';
    
    // Стили для корректной печати титульника, оглавления и текста
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
        @media print {
            body, html { margin: 0; padding: 0; box-shadow: none; background: white; }
            #my-pdf-overlay { position: relative !important; overflow: visible !important; padding: 0 !important; width: 100% !important; font-size: 12pt !important; }
            #my-pdf-overlay > div { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
            
            /* Заголовки */
            #my-pdf-overlay h1 { font-size: 18pt !important; margin-top: 1cm !important; margin-bottom: 0.5cm !important; page-break-after: avoid; }
            #my-pdf-overlay h2 { font-size: 16pt !important; margin-top: 0.8cm !important; margin-bottom: 0.4cm !important; page-break-after: avoid; }
            #my-pdf-overlay h3 { font-size: 14pt !important; margin-top: 0.6cm !important; margin-bottom: 0.3cm !important; page-break-after: avoid; }
            
            /* Текст */
            #my-pdf-overlay p { margin-bottom: 0.3cm !important; text-indent: 1.2cm; text-align: justify; widows: 2; orphans: 2; }
            
            /* Секции */
            .page-break-before { break-before: page; page-break-before: always; }
            .page-break-after { break-after: page; page-break-after: always; }
            
            /* Оглавление */
            .toc-item { text-decoration: none; color: black; display: block; margin-bottom: 6px; page-break-inside: avoid; }
            
            #parser-progress { display: none !important; }
            @page { margin: 2cm; size: A4 portrait; }
            img { max-width: 100% !important; height: auto !important; page-break-inside: avoid; display: block; margin: 0 auto; }
        }
    `;
    document.head.appendChild(printStyles);

    const progressBox = document.createElement('div');
    progressBox.id = 'parser-progress';
    progressBox.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ffeaa7; padding: 15px; border: 2px solid #fdcb6e; border-radius: 8px; font-family: sans-serif; font-weight: bold; font-size: 14px; color: black; box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 999999999;';
    progressBox.innerText = 'Инициализация...';
    document.body.appendChild(progressBox);

    const contentBox = document.createElement('div');
    contentBox.style.cssText = 'max-width: 800px; margin: 0 auto; background: white; padding-bottom: 100px;';
    overlay.appendChild(contentBox);
    document.documentElement.appendChild(overlay);

    const API_BASE = "https://mb4rdr.mb4-cms.ru/api/3.0/mb4rdr-bff/retrieve";
    const headers = { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${reader_access_token}` 
    };

    function updateProgress(text) {
        progressBox.innerText = text;
        console.log(text);
    }

    try {
        updateProgress("🔄 Запрашиваем информацию о книге...");
        
        // 1. Получаем стартовые данные (Титульник + Оглавление)
        const bookResponse = await fetch(`${API_BASE}/book-data/json`, {
            method: 'POST', headers, body: JSON.stringify({ id: reader_book })
        }).then(r => r.json());

        // --- СОЗДАНИЕ ТИТУЛЬНОГО ЛИСТА ---
        if (bookResponse.book_title_data) {
            const getTagInfo = (tag) => {
                const item = bookResponse.book_title_data.find(d => d.tag === tag);
                return item ? item.value : '';
            };

            const titlePage = document.createElement('div');
            // Делаем разрыв страницы после титульника!
            titlePage.className = 'page-break-after'; 
            titlePage.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; text-align: center; padding: 40px 20px;';

            const authors = getTagInfo('authors');
            const title = getTagInfo('title') || bookResponse.title;
            const publisher = getTagInfo('publisher');
            const year = getTagInfo('year');
            const isbn = getTagInfo('isbn');
            const bibliograpy = getTagInfo('bibliography');
            const annotation = getTagInfo('annotation');

            let titleHTML = '';
            
            // Если есть обложка
            if (bookResponse.avatar_locator) {
                const coverUrl = `https://www.studentlibrary.ru/${bookResponse.avatar_locator}`;
                titleHTML += `<img src="${coverUrl}" style="max-height: 350px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #eee;">`;
            }

            if (authors) titleHTML += `<div style="font-size: 20px; margin-bottom: 20px; color: #555;">${authors}</div>`;
            if (title) titleHTML += `<h1 style="font-size: 36px; margin: 0 0 40px 0; font-weight: bold; line-height: 1.2;">${title}</h1>`;
            
            titleHTML += `<div style="margin-top: auto; font-size: 16px; color: #555;">`;
            if (publisher) titleHTML += `<div>${publisher}</div>`;
            if (year) titleHTML += `<div>${year} г.</div>`;
            titleHTML += `</div>`;

            titlePage.innerHTML = titleHTML;
            contentBox.appendChild(titlePage);

            // --- БИБЛИОГРАФИЯ И АННОТАЦИЯ (Вторая страница) ---
            if (bibliograpy || annotation || isbn) {
                const infoPage = document.createElement('div');
                infoPage.className = 'page-break-after';
                infoPage.style.cssText = 'font-size: 14px; text-align: justify; padding: 40px; background: #fff; margin-top: 20px; line-height: 1.6;';
                
                let infoHTML = '';
                if (isbn) infoHTML += `<p><strong>ISBN:</strong> ${isbn}</p>`;
                if (bibliograpy) infoHTML += `<p><strong>Библиографическая запись:</strong><br>${bibliograpy}</p>`;
                if (annotation) infoHTML += `<p style="margin-top: 20px;"><strong>Аннотация:</strong><br>${annotation}</p>`;
                
                infoPage.innerHTML = infoHTML;
                contentBox.appendChild(infoPage);
            }
        }

        // --- ОГЛАВЛЕНИЕ ---
        const chapters = bookResponse.toc?.content || [];
        if (chapters.length === 0) throw new Error("Не удалось найти список глав.");
        
        updateProgress(`📚 Найдено глав: ${chapters.length}`);

        const tocContainer = document.createElement('div');
        tocContainer.className = 'page-break-after';
        tocContainer.style.cssText = 'padding: 20px; margin-bottom: 40px;';
        tocContainer.innerHTML = '<h1 style="text-align: center; margin-bottom: 30px; font-size: 28px;">Оглавление</h1>';
        
        const tocList = document.createElement('div');
        tocList.style.cssText = 'line-height: 1.6; font-size: 16px;';
        tocContainer.appendChild(tocList);
        contentBox.appendChild(tocContainer);

        function extractHeaders(bodyArray, targetMap, currentChapterId) {
            bodyArray.forEach(item => {
                if (item.locator && item.head) {
                    const parts = item.locator.split('/');
                    const tabNumber = parts[parts.length - 1]; 
                    if (!targetMap[tabNumber]) targetMap[tabNumber] = [];
                    targetMap[tabNumber].push({ text: item.head, level: parts.length }); 
                }
                if (item.body && item.body.length > 0) {
                    extractHeaders(item.body, targetMap, currentChapterId);
                }
            });
        }

        const parserDiv = document.createElement('div');

        // --- ПАРСИНГ ГЛАВ ---
        for (let i = 0; i < chapters.length; i++) {
            const chap = chapters[i];
            
            const tabsConfResponse = await fetch(`${API_BASE}/doctabs/json`, {
                method: 'POST', headers, body: JSON.stringify({ book_id: reader_book, id: chap.id })
            }).then(r => r.json());

            const tabs = tabsConfResponse.tabs || [];
            
            const chapterTitleText = tabsConfResponse.title || `Глава ${i + 1}`;
            const chapterAnchor = `chap-${i}`;

            // Ссылка в оглавление
            const tocItem = document.createElement('a');
tocItem.href = `#${chapterAnchor}`;
tocItem.className = 'toc-item';
tocItem.textContent = chapterTitleText;
tocList.appendChild(tocItem);

            const subHeadersMap = {};
            if (tabsConfResponse.toc && tabsConfResponse.toc.body) {
                extractHeaders(tabsConfResponse.toc.body, subHeadersMap, chap.id);
            }

            // Вывод Заголовка Главы
            const chapTitleEl = document.createElement('h1'); 
            chapTitleEl.id = chapterAnchor;
            // Класс page-break-before переносит каждую новую главу на новый лист при печати
            chapTitleEl.className = 'page-break-before';
            chapTitleEl.style.cssText = 'margin-top: 60px; font-size: 26px; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 30px;';
            chapTitleEl.innerText = chapterTitleText;
            contentBox.appendChild(chapTitleEl);
            
            // Вывод подзаголовков и текста
            for (let j = 0; j < tabs.length; j++) {
                const tabId = tabs[j].tab;
                updateProgress(`⏳ Скачиваем... Глава ${i + 1} из ${chapters.length} (блок ${j + 1}/${tabs.length})`);
                
                if (subHeadersMap[tabId]) {
                    subHeadersMap[tabId].forEach(subHead => {
                        // Подзаголовки выводим тегами <h3>
                        const subHeadEl = document.createElement('h3');
                        subHeadEl.style.cssText = 'margin-top: 35px; margin-bottom: 15px; font-size: 20px; font-weight: bold; color: #333;';
                        subHeadEl.innerText = subHead.text;
                        contentBox.appendChild(subHeadEl);
                    });
                }

                const contentResponse = await fetch(`${API_BASE}/doctab/json`, {
                    method: 'POST', headers, body: JSON.stringify({ book_id: reader_book, id: chap.id, tab: tabId })
                }).then(r => r.json());
                
                const textNodes = contentResponse.tabs || contentResponse.abs || [];
                
                if (textNodes.length > 0) {
                    const htmlChunk = textNodes.map(a => a.html).join(' ');
                    
                    if (htmlChunk && htmlChunk.trim() !== '') {
                        parserDiv.innerHTML = htmlChunk;
                        
                        const allEls = parserDiv.querySelectorAll('*');
                        allEls.forEach(el => {
                            if (el.tagName.toLowerCase() !== 'img') {
                                el.removeAttribute('style');
                            } else {
                                el.style.cssText = 'max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                            }
                            el.removeAttribute('class');
                            el.removeAttribute('id');
                            if (el.tagName.toLowerCase() === 'div' && el.innerText.trim() === '' && el.childNodes.length === 0) {
                                el.remove();
                            }
                        });

                        // Оформление текста (шрифт + абзацы)
                        Array.from(parserDiv.querySelectorAll('p')).forEach(p => {
                            p.style.marginBottom = '12px';
                            p.style.textIndent = '30px';
                            p.style.textAlign = 'justify';
                        });

                        Array.from(parserDiv.childNodes).forEach(node => {
                            contentBox.appendChild(node.cloneNode(true));
                        });
                    }
                }
                
                await new Promise(res => setTimeout(res, 150));
            }
        }

        updateProgress("✅ Сборник успешно сформирован!");
        
        // Скрываем сайт
        Array.from(document.body.children).forEach(child => {
            if (child.id !== 'my-pdf-overlay' && child.id !== 'parser-progress' && child.tagName !== 'STYLE') {
                child.style.display = 'none';
            }
        });
        document.body.style.overflow = 'hidden';

function downloadStandaloneHtml() {
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${document.title || 'StudentLibrary Export'}</title>
<style>
body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.5; color: black; }
p { text-indent: 1.2cm; text-align: left; white-space: normal; hyphens: none; }
a { color: black; text-decoration: none; }
.toc-item { display: block; margin-bottom: 6px; }
.page-break-before { page-break-before: always; break-before: page; }
.page-break-after { page-break-after: always; break-after: page; }
img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
@page { margin: 2cm; size: A4 portrait; }
</style>
</head>
<body>${contentBox.innerHTML}</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'studentlibrary-book.html';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

downloadStandaloneHtml();

        setTimeout(() => { document.getElementById('parser-progress').style.display = 'none'; }, 4000);
        console.log("🎉 Готово! Жми Ctrl+P и сохраняй в PDF.");

    } catch(e) {
         console.error(e);
         updateProgress("❌ Ошибка парсинга. Разверни ошибку в консоли.");
    }
})();

